package com.example.backend.config;

import static com.example.backend.security.Roles.ADMINISTRADOR;
import static com.example.backend.security.Roles.ALMACENERO;
import static com.example.backend.security.Roles.ASISTENTE_COMPRA;
import static com.example.backend.security.Roles.GERENTE;
import static com.example.backend.security.Roles.VENDEDOR;

import java.time.Clock;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.backend.security.JwtAuthFilter;
import com.example.backend.security.JwtService;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Autenticación con JWT y autorización por rol en cada endpoint (RF08, RNF01).
 * Los permisos coinciden con los de auth.service.ts del frontend.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) ->
                    responderError(res, HttpServletResponse.SC_UNAUTHORIZED, "Debe iniciar sesión"))
                .accessDeniedHandler((req, res, ex) ->
                    responderError(res, HttpServletResponse.SC_FORBIDDEN, "No tiene permisos para realizar esta acción")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/cambiar-password").permitAll()

                // Productos: todos consultan (RF01, RF03); solo gerente y administrador modifican
                .requestMatchers(HttpMethod.GET, "/api/productos/**").authenticated()
                .requestMatchers("/api/productos/**").hasAnyRole(ADMINISTRADOR, GERENTE)

                // Clientes (RF07)
                .requestMatchers(HttpMethod.DELETE, "/api/clientes/**").hasAnyRole(ADMINISTRADOR, GERENTE)
                .requestMatchers("/api/clientes/**").hasAnyRole(ADMINISTRADOR, GERENTE, VENDEDOR)

                // Ventas y devoluciones (RF06, RF10)
                .requestMatchers("/api/ventas/**", "/api/devoluciones/**").hasAnyRole(ADMINISTRADOR, GERENTE, VENDEDOR)

                // Proveedores
                .requestMatchers(HttpMethod.GET, "/api/proveedores/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA, ALMACENERO)
                .requestMatchers("/api/proveedores/**").hasAnyRole(ADMINISTRADOR, GERENTE)

                // Solicitudes de compra (RF02): solo indican qué se necesita comprar
                .requestMatchers(HttpMethod.GET, "/api/solicitudes/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA, ALMACENERO)
                .requestMatchers("/api/solicitudes/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA)

                // Cotizaciones (RF04)
                .requestMatchers("/api/cotizaciones/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA)

                // Órdenes de compra (RF05): crear gerente/administrador; aprobar o rechazar SOLO gerente
                .requestMatchers(HttpMethod.GET, "/api/ordenes/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA, ALMACENERO)
                .requestMatchers(HttpMethod.PUT, "/api/ordenes/*/aprobar", "/api/ordenes/*/rechazar").hasRole(GERENTE)
                .requestMatchers(HttpMethod.POST, "/api/ordenes/**").hasAnyRole(ADMINISTRADOR, GERENTE)

                // Entregas de mercadería desde una orden aprobada
                .requestMatchers("/api/entregas/**").hasAnyRole(ADMINISTRADOR, GERENTE, ASISTENTE_COMPRA, ALMACENERO)

                .anyRequest().authenticated())
            .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Evita que Spring cree un usuario por defecto: el login se hace en AuthController
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }

    @Bean
    public Clock clock(@Value("${app.zona-horaria}") String zonaHoraria) {
        return Clock.system(ZoneId.of(zonaHoraria));
    }

    private static void responderError(HttpServletResponse res, int status, String mensaje) throws java.io.IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write("{\"status\":" + status + ",\"message\":\"" + mensaje + "\"}");
    }
}
