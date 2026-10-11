package com.example.backend.model.service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.dto.CambioPasswordRequest;
import com.example.backend.model.dto.LoginRequest;
import com.example.backend.model.dto.LoginResponse;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.UsuarioRepository;
import com.example.backend.security.JwtService;
import com.example.backend.security.PoliticaContrasena;

/**
 * Login y cambio de contraseña (RF08, RF09, RNF01).
 * No es @Transactional a propósito: el contador de intentos fallidos debe
 * guardarse aunque luego se lance la excepción de credenciales incorrectas.
 */
@Service
public class AuthServiceImpl implements AuthService {

    static final String CREDENCIALES_INCORRECTAS = "Usuario o contraseña incorrectos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Clock clock;
    private final int maxIntentos;
    private final int minutosBloqueo;

    public AuthServiceImpl(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                           JwtService jwtService, Clock clock,
                           @Value("${seguridad.max-intentos}") int maxIntentos,
                           @Value("${seguridad.minutos-bloqueo}") int minutosBloqueo) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.clock = clock;
        this.maxIntentos = maxIntentos;
        this.minutosBloqueo = minutosBloqueo;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = verificarCredenciales(request.nombreUsuario(), request.contraseña());
        return new LoginResponse(jwtService.generarToken(usuario), usuario);
    }

    @Override
    public void cambiarPassword(CambioPasswordRequest request) {
        Usuario usuario = verificarCredenciales(request.nombreUsuario(), request.contraseñaActual());

        String error = PoliticaContrasena.validar(
                request.contraseñaNueva(), request.contraseñaActual(), usuario.getNombreUsuario());
        if (error != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, error);
        }

        usuario.setContraseña(passwordEncoder.encode(request.contraseñaNueva()));
        usuarioRepository.save(usuario);
    }

    /**
     * Comprueba usuario y contraseña aplicando el bloqueo por intentos fallidos.
     * El mensaje de error no revela si falló el usuario o la contraseña (CA16).
     */
    private Usuario verificarCredenciales(String nombreUsuario, String contraseña) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INCORRECTAS));

        LocalDateTime ahora = LocalDateTime.now(clock);
        if (usuario.getBloqueadoHasta() != null && usuario.getBloqueadoHasta().isAfter(ahora)) {
            throw new ResponseStatusException(HttpStatus.LOCKED, mensajeBloqueo(usuario.getBloqueadoHasta(), ahora));
        }

        if (!passwordEncoder.matches(contraseña, usuario.getContraseña())) {
            int intentos = (usuario.getIntentosFallidos() == null ? 0 : usuario.getIntentosFallidos()) + 1;
            if (intentos >= maxIntentos) {
                usuario.setIntentosFallidos(0);
                usuario.setBloqueadoHasta(ahora.plusMinutes(minutosBloqueo));
                usuarioRepository.save(usuario);
                throw new ResponseStatusException(HttpStatus.LOCKED,
                        "Cuenta bloqueada por " + minutosBloqueo + " minutos tras " + maxIntentos + " intentos fallidos");
            }
            usuario.setIntentosFallidos(intentos);
            usuarioRepository.save(usuario);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INCORRECTAS);
        }

        if ((usuario.getIntentosFallidos() != null && usuario.getIntentosFallidos() > 0) || usuario.getBloqueadoHasta() != null) {
            usuario.setIntentosFallidos(0);
            usuario.setBloqueadoHasta(null);
            usuarioRepository.save(usuario);
        }
        return usuario;
    }

    private static String mensajeBloqueo(LocalDateTime bloqueadoHasta, LocalDateTime ahora) {
        long minutos = Math.max(1, (long) Math.ceil(Duration.between(ahora, bloqueadoHasta).getSeconds() / 60.0));
        return "Cuenta bloqueada por intentos fallidos. Intente nuevamente en " + minutos + " minuto(s)";
    }
}
