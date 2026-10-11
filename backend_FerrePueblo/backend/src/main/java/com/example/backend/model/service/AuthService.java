package com.example.backend.model.service;

import com.example.backend.model.dto.CambioPasswordRequest;
import com.example.backend.model.dto.LoginRequest;
import com.example.backend.model.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void cambiarPassword(CambioPasswordRequest request);
}
