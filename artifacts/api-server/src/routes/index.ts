import { Router, type IRouter } from "express";
import healthRouter from "./health";
import giftsRouter from "./gifts";
import cardArtRouter from "./card-art";

const router: IRouter = Router();

router.use(healthRouter);
router.use(giftsRouter);
router.use(cardArtRouter);

export default router;
