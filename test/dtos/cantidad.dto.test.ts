import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActualizarCantidadDTO } from '../../src/dtos/pedido/actualizarCantidad.dto';
import { CrearPedidoDTO } from '../../src/dtos/pedido/crearPedido.dto';
import { SincronizarProductosDTO } from '../../src/dtos/paquete/sincronizarProductos.dto';

describe('ActualizarCantidadDTO', () => {
  async function validar(cantidad: unknown) {
    const dto = plainToInstance(ActualizarCantidadDTO, { cantidad });
    return validate(dto);
  }

  it('acepta cantidad = 1', async () => {
    expect(await validar(1)).toHaveLength(0);
  });

  it('rechaza cantidad = 0', async () => {
    expect(await validar(0)).not.toHaveLength(0);
  });

  it('rechaza cantidad negativa', async () => {
    expect(await validar(-5)).not.toHaveLength(0);
  });

  it('rechaza decimal', async () => {
    expect(await validar(1.5)).not.toHaveLength(0);
  });
});

describe('CrearPedidoDTO — campo cantidad', () => {
  async function validar(cantidad: unknown) {
    const dto = plainToInstance(CrearPedidoDTO, { productoId: 1, cantidad });
    return validate(dto);
  }

  it('acepta cantidad = 1', async () => {
    expect(await validar(1)).toHaveLength(0);
  });

  it('rechaza cantidad = 0', async () => {
    expect(await validar(0)).not.toHaveLength(0);
  });

  it('rechaza cantidad negativa', async () => {
    expect(await validar(-3)).not.toHaveLength(0);
  });

  it('rechaza decimal', async () => {
    expect(await validar(2.7)).not.toHaveLength(0);
  });
});

describe('SincronizarProductosDTO', () => {
  async function validar(productosId: unknown) {
    const dto = plainToInstance(SincronizarProductosDTO, { productosId });
    return validate(dto);
  }

  it('acepta array vacío', async () => {
    expect(await validar([])).toHaveLength(0);
  });

  it('rechaza duplicados', async () => {
    expect(await validar([1, 1])).not.toHaveLength(0);
  });

  it('rechaza IDs no positivos', async () => {
    expect(await validar([0])).not.toHaveLength(0);
  });
});
