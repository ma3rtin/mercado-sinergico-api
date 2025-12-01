import { Request, Response } from "express";
import { PaquetePublicadoService } from "../services/paquetePublicado.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../errors/custom.error";

export class PaquetePublicadoController {
  constructor(private service: PaquetePublicadoService) {}

  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getAll();
    if (!paquetes) throw new CustomError("Paquetes no encontrados", 404);
    res.status(200).json(paquetes);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === "")
      throw new CustomError("Id de paquete no proporcionado", 400);

    const paquete = await this.service.getById(Number(id));
    if (!paquete) throw new CustomError("Paquete no encontrado", 404);

    res.status(200).json(paquete);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const paquetePublicadoDTO = req.body;
    if (!paquetePublicadoDTO)
      throw new CustomError("Paquete no proporcionado", 400);

    const paquetePublicado = await this.service.create(paquetePublicadoDTO);
    if (!paquetePublicado) throw new CustomError("Error al crear paquete", 400);

    res.status(201).json(paquetePublicado);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError("Id de paquete no proporcionado", 400);

    const paquetePublicado = await this.service.update(Number(id), req.body);
    if (!paquetePublicado)
      throw new CustomError("Error al actualizar paquete", 400);

    res.json(paquetePublicado);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === "")
      throw new CustomError("Id de paquete no proporcionado", 400);

    const paquetePublicado = await this.service.delete(Number(id));
    if (!paquetePublicado)
      throw new CustomError("Error al eliminar paquete", 400);

    res.status(200).json({ message: "Paquete eliminado" });
  });

  getPorCerrarse = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getPorCerrarse();
    if (!paquetes || paquetes.length === 0)
      throw new CustomError("No hay paquetes por cerrarse", 404);

    res.status(200).json(paquetes);
  });
}
