import { Request, Response } from "express";

export function getAdminOnly(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "Admin route accessed successfully",
    data: {
      user: req.user,
    },
  });
}