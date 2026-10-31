import { Router, type IRouter } from "express";
import healthRouter from "./health";
import giftsRouter from "./gifts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(giftsRouter);

export default router;
