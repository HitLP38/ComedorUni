import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  alumnoId: number | null;
  codigoAlumno: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, alumnoId: number, codigo: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  alumnoId: null,
  codigoAlumno: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  setAuth: (token, alumnoId, codigo) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token, alumnoId, codigoAlumno: codigo, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ accessToken: null, alumnoId: null, codigoAlumno: null, isAuthenticated: false });
  },
}));
