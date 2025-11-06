import findProcessFn, { type FindFunction } from "find-process"

export const findProcess = ((findProcessFn as any).default || findProcessFn) as FindFunction
