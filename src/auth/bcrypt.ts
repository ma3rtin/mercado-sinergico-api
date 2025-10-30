import bcrypt from 'bcrypt';

export async function cifrarContraseña(password: string): Promise<string> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export async function compararContraseñas(contraseña: string,contraseñaCifrada: string): Promise<boolean> {
  return bcrypt.compare(contraseña, contraseñaCifrada);
}