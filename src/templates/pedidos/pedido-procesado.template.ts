export const notificarProcesoPedido = (nombreCliente: string, idPedido: string) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hola ${nombreCliente},</h2>
      <p>Tu pedido con ID <strong>${idPedido}</strong> ha sido procesado exitosamente.</p>
      <p>Ahora comenzaremos con la elaboración/preparación de tus productos.</p>
      <p>Te notificaremos nuevamente cuando tu pedido esté en camino.</p>
      <br>
      <p>Gracias por tu compra,</p>
      <p>El equipo de Mercado Sinérgico</p>
    </div>
  `;
};
