import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import travelersRouter from "./travelers";
import aiRouter from "./ai";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(travelersRouter);
router.use(aiRouter);
router.use(storageRouter);

export default router;
