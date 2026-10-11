package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * Al iniciar, cifra con BCrypt las contraseñas que aún estén en texto plano
 * (por ejemplo, las del script de datos de prueba). Las ya cifradas no se tocan,
 * por lo que es seguro ejecutarlo en cada arranque (RNF01).
 */
@Component
@RequiredArgsConstructor
public class CifradoContrasenasInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CifradoContrasenasInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        int cifradas = 0;
        for (Usuario usuario : usuarioRepository.findAll()) {
            if (!esBcrypt(usuario.getContraseña())) {
                usuario.setContraseña(passwordEncoder.encode(usuario.getContraseña()));
                usuarioRepository.save(usuario);
                cifradas++;
            }
        }
        if (cifradas > 0) {
            log.info("Se cifraron {} contraseña(s) que estaban en texto plano", cifradas);
        }
    }

    static boolean esBcrypt(String valor) {
        return valor != null && valor.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
    }
}
