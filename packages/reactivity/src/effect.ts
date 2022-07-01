let activeEffect: ReactiveEffect | null = null

interface ReactiveEffectRunner<T = any> {
    (): T,
    effect:ReactiveEffect
}

interface ReactiveEffectOption {
    lazy?:boolean,
    scheduler?: (...args:any[]) => any
}

export function stop(runner:ReactiveEffectRunner) {
    return runner.effect.stop()
}

function cleanupEffect(effect: ReactiveEffect) {
    const { deps } = effect
    deps.forEach(dep => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}

class ReactiveEffect {
    active = true
    parent: ReactiveEffect | null = null
    deps: Set<ReactiveEffect>[] = []
    constructor(public fn: Function, public scheduler:Function|undefined) {}

    run() {
        if (!this.active) {
            return this.fn()
        }
        // let parent: ReactiveEffect | null = activeEffect
        // while (parent) {
        //     if (parent === this) {
        //         return
        //     }
        //     parent = parent.parent
        // }
        try {
            this.parent = activeEffect
            activeEffect = this
            cleanupEffect(activeEffect)
            return this.fn()
        } finally {
            activeEffect = this.parent
        }
    }

    stop() {
        if(this.active) {
            this.active = false
            cleanupEffect(this)
        }
    }
}

export function effect(fn: Function, option?: ReactiveEffectOption) {
    const _effect = new ReactiveEffect(fn, option?.scheduler)
    _effect.run()

    const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
    runner.effect = _effect
    return runner
}

const targetMap = new WeakMap<any, Map<any, Set<ReactiveEffect>>>()
export function track(target: object, type: string, key: unknown) {
    if (!activeEffect) {
        return
    }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map<any, Set<ReactiveEffect>>()))
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, (deps = new Set<ReactiveEffect>()))
    }
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect)
        activeEffect.deps.push(deps)
    }
}

export function trigger(target: object, type: string, key: unknown) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    let deps = depsMap.get(key)
    if (deps) {
        deps = new Set(deps)
        deps.forEach(effect => {
            if(effect.scheduler) {
                effect.scheduler()
            }else {
                effect.run()
            }
        })
    }
}
