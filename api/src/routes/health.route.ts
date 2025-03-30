import { type RouteHandlerMethod } from "fastify";

export let healthRouteHandler: RouteHandlerMethod = async function (req, res) {
    return res.status(200).send({ message: "OK" });
};
