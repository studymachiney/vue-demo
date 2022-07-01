import { isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, reactiveMap, toRaw } from "./reactive"

export const mutableHandler:ProxyHandler<any> = {
    get(target, key, receiver) {
        if(key === ReactiveFlags.IS_REACTIVE) {
            return true
        } else if(key === ReactiveFlags.RAW && reactiveMap.get(target) === receiver) {
            return target
        }
        
        const res =  Reflect.get(target, key, receiver)
        track(target, 'get', key)
        if(isObject(res)) {
            return reactive(res)
        }
        return res
    },
    set(target, key, value, receiver) {
        value = toRaw(value)
        const oldValue = Reflect.get(target, key)
        const res =  Reflect.set(target, key, value, receiver)
        if(oldValue !== value) {
            trigger(target, 'set', key)
        }
        return res
    },
    deleteProperty(target, key) {
        const hadKey = Reflect.has(target, key)
        const res = Reflect.deleteProperty(target, key)
        if(hadKey && res) {
            trigger(target, 'delete', key)
        }
        return res
    }
}