export const notificarEnvioPedido = (nombreCliente: string, idSeguimiento: string | null) => {
    const trackingInfo = idSeguimiento
        ? `<p>Tu número de seguimiento es: <strong>${idSeguimiento}</strong></p>`
        : '';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hola ${nombreCliente},</h2>
      <p>¡Buenas noticias! Tu pedido ha sido enviado.</p>
      ${trackingInfo}
      <p>Pronto recibirás tus productos.</p>
      <br>
      <p>Gracias por confiar en nosotros,</p>
      <p>El equipo de Mercado Sinérgico</p>
    </div>
  `;
};
