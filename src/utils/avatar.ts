import {createCanvas} from 'canvas';

export function generarAvatar(nombre: string, apellido: string): Buffer {
    const iniciales = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
  
    const colores = ["#ff7675", "#74b9ff", "#55efc4", "#ffeaa7", "#a29bfe"];
    ctx.fillStyle = colores[Math.floor(Math.random() * colores.length)];
    ctx.fillRect(0, 0, 200, 200);
  
    ctx.font = "bold 90px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(iniciales, 100, 110);
  
    return canvas.toBuffer("image/png");
  }