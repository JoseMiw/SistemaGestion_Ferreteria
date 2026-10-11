package com.example.backend.model.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.dto.CambioPasswordRequest;
import com.example.backend.model.dto.LoginRequest;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.UsuarioRepository;
import com.example.backend.security.JwtService;

/** RF08, RF09 y RNF01: login, bloqueo tras 5 fallos y cambio de contraseña. */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final Clock RELOJ = Clock.fixed(Instant.parse("2026-09-29T15:00:00Z"), LIMA);

    @Mock
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService = new JwtService("MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=", 60);
    private AuthServiceImpl authService;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        authService = new AuthServiceImpl(usuarioRepository, encoder, jwtService, RELOJ, 5, 15);
        usuario = new Usuario(3);
        usuario.setNombreUsuario("Vendedor");
        usuario.setContraseña(encoder.encode("Clave2026"));
        usuario.setRol("VENDEDOR");
        usuario.setIntentosFallidos(0);
        when(usuarioRepository.findByNombreUsuario("Vendedor")).thenReturn(Optional.of(usuario));
    }

    @Test
    void loginCorrectoDevuelveTokenConElRol() {
        var respuesta = authService.login(new LoginRequest("Vendedor", "Clave2026"));
        assertNotNull(respuesta.token());
        var autenticado = jwtService.validarToken(respuesta.token());
        assertEquals("VENDEDOR", autenticado.rol());
        assertEquals(3, autenticado.idUsuario());
    }

    @Test
    void claveIncorrectaDevuelveMensajeGenericoYCuentaElIntento() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("Vendedor", "mala")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals(AuthServiceImpl.CREDENCIALES_INCORRECTAS, ex.getReason());
        assertEquals(1, usuario.getIntentosFallidos());
    }

    @Test
    void quintoIntentoFallidoBloquea15Minutos() {
        usuario.setIntentosFallidos(4);
        var ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("Vendedor", "mala")));
        assertEquals(HttpStatus.LOCKED, ex.getStatusCode());
        assertEquals(LocalDateTime.now(RELOJ).plusMinutes(15), usuario.getBloqueadoHasta());
    }

    @Test
    void cuentaBloqueadaRechazaInclusoLaClaveCorrecta() {
        usuario.setBloqueadoHasta(LocalDateTime.now(RELOJ).plusMinutes(10));
        var ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("Vendedor", "Clave2026")));
        assertEquals(HttpStatus.LOCKED, ex.getStatusCode());
    }

    @Test
    void bloqueoVencidoPermiteEntrarYReiniciaElContador() {
        usuario.setBloqueadoHasta(LocalDateTime.now(RELOJ).minusMinutes(1));
        usuario.setIntentosFallidos(2);
        authService.login(new LoginRequest("Vendedor", "Clave2026"));
        assertEquals(0, usuario.getIntentosFallidos());
        assertNull(usuario.getBloqueadoHasta());
    }

    @Test
    void cambioDePasswordValidoCifraLaNueva() {
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        authService.cambiarPassword(new CambioPasswordRequest("Vendedor", "Clave2026", "Nueva2027"));
        assertEquals(true, encoder.matches("Nueva2027", usuario.getContraseña()));
    }

    @Test
    void cambioDePasswordRechazaPoliticaYNoCambiaLaClave() {
        String hashAnterior = usuario.getContraseña();
        var ex = assertThrows(ResponseStatusException.class,
                () -> authService.cambiarPassword(new CambioPasswordRequest("Vendedor", "Clave2026", "corta1")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals(hashAnterior, usuario.getContraseña());
    }

    @Test
    void cambioDePasswordConActualIncorrectaSeRechaza() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> authService.cambiarPassword(new CambioPasswordRequest("Vendedor", "mala", "Nueva2027")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }
}
