import { mutableHandler } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '_V_IsREACTIVE',
    RAW = '_V_RAW'
}


export const reactiveMap = new WeakMap()
export function reactive<T extends object>(target: T):T {
    const existProxy = reactiveMap.get(target)
    if(existProxy) {
        return existProxy
    }
    if(isReactive(target)) {
        return target
    }
    if(!Object.isExtensible(target)) {
        return target
    }
    const proxy =  new Proxy(target, mutableHandler)
    reactiveMap.set(target, proxy)
    return proxy
}

export function isReactive(target: unknown) {
    return !!(target && (target as any)[ReactiveFlags.IS_REACTIVE])
}

export function toRaw<T>(target: T):T {
    const raw = target && (target as any)[ReactiveFlags.RAW]
    return raw ? toRaw(raw) : target
}