import { Request, Response } from "express";

export function getMe(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "Authenticated user profile fetched successfully",
    data: {
      user: req.user,
    },
  });
}