// La contraseña nunca llega del backend (RNF01)
export interface Usuario {
    idUsuario: number;
    nombreUsuario: string;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
}

export interface LoginResponse {
    token: string;
    usuario: Usuario;
}
