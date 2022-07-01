import { effect, stop } from "../src/effect"
import { reactive } from "../src/reactive"

describe('reactivity/effect', () => {
    // step1
    it('should run the passed function once (wrapped by a effect)', () => {
      const fnSpy = jest.fn(() => {})
      effect(fnSpy)
      expect(fnSpy).toHaveBeenCalledTimes(1)
    })

    //step2
    it('should observe basic properties', () => {
        let dummy
        const counter = reactive({ num: 0 })
        effect(() => (dummy = counter.num))
    
        expect(dummy).toBe(0)
        counter.num = 7
        expect(dummy).toBe(7)
      })
    
      it('should observe multiple properties', () => {
        let dummy
        const counter = reactive({ num1: 0, num2: 0 })
        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))
    
        expect(dummy).toBe(0)
        counter.num1 = counter.num2 = 7
        expect(dummy).toBe(21)
      })

      it('should observe multiple properties', () => {
        let dummy
        const counter = reactive({ num1: 0, num2: 0 })
        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))
    
        expect(dummy).toBe(0)
        counter.num1 = counter.num2 = 7
        expect(dummy).toBe(21)
      })

      it('should handle multiple effects', () => {
        let dummy1, dummy2
        const counter = reactive({ num: 0 })
        effect(() => (dummy1 = counter.num))
        effect(() => (dummy2 = counter.num))
    
        expect(dummy1).toBe(0)
        expect(dummy2).toBe(0)
        counter.num++
        expect(dummy1).toBe(1)
        expect(dummy2).toBe(1)
      })

      it('should observe nested properties', () => {
        let dummy
        const counter = reactive({ nested: { num: 0 } })
        effect(() => (dummy = counter.nested.num))
    
        expect(dummy).toBe(0)
        counter.nested.num = 8
        expect(dummy).toBe(8)
      })

      //step3
      it('should observe delete operations', () => {
        let dummy
        const obj = reactive<{
          prop?: string
        }>({ prop: 'value' })
        effect(() => (dummy = obj.prop))
    
        expect(dummy).toBe('value')
        delete obj.prop
        expect(dummy).toBe(undefined)
      })

      // step4
      it('should allow nested effects', () => {
        const nums = reactive({ num1: 0, num2: 1, num3: 2 })
        const dummy: any = {}
    
        const childSpy = jest.fn(() => (dummy.num1 = nums.num1))
        const childeffect = effect(childSpy)
        const parentSpy = jest.fn(() => {
          dummy.num2 = nums.num2
          childeffect()
          dummy.num3 = nums.num3
        })
        effect(parentSpy)
    
        expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 })
        expect(parentSpy).toHaveBeenCalledTimes(1)
        expect(childSpy).toHaveBeenCalledTimes(2)
        // this should only call the childeffect
        nums.num1 = 4
        expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 })
        expect(parentSpy).toHaveBeenCalledTimes(1)
        expect(childSpy).toHaveBeenCalledTimes(3)
        // this calls the parenteffect, which calls the childeffect once
        nums.num2 = 10
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 })
        expect(parentSpy).toHaveBeenCalledTimes(2)
        expect(childSpy).toHaveBeenCalledTimes(4)
        // this calls the parenteffect, which calls the childeffect once
        nums.num3 = 7
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 })
        expect(parentSpy).toHaveBeenCalledTimes(3)
        expect(childSpy).toHaveBeenCalledTimes(5)
      })

      
    
    
      //step 5
      it('should discover new branches while running automatically', () => {
        let dummy
        const obj = reactive({ prop: 'value', run: false })
    
        const conditionalSpy = jest.fn(() => {
          dummy = obj.run ? obj.prop : 'other'
        })
        effect(conditionalSpy)
    
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.prop = 'Hi'
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.run = true
        expect(dummy).toBe('Hi')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
        obj.prop = 'World'
        expect(dummy).toBe('World')
        expect(conditionalSpy).toHaveBeenCalledTimes(3)
      })
      
      it('should not be triggered by mutating a property, which is used in an inactive branch', () => {
        let dummy
        const obj = reactive({ prop: 'value', run: true })
    
        const conditionalSpy = jest.fn(() => {
          dummy = obj.run ? obj.prop : 'other'
        })
        effect(conditionalSpy)
    
        expect(dummy).toBe('value')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.run = false
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
        obj.prop = 'value2'
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
      })

      //step6
      it('stop', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
          dummy = obj.prop
        })
        obj.prop = 2
        expect(dummy).toBe(2)
        stop(runner)
        obj.prop = 3
        expect(dummy).toBe(2)
    
        // stopped effect should still be manually callable
        runner()
        expect(dummy).toBe(3)
      })

      it('stop: a stopped effect is nested in a normal effect', () => {
        let dummy
        const obj = reactive({ prop: 1 })
        const runner = effect(() => {
          dummy = obj.prop
        })
        stop(runner)
        obj.prop = 2
        expect(dummy).toBe(1)
    
        // observed value in inner stopped effect
        // will track outer effect as an dependency
        effect(() => {
          runner()
        })
        expect(dummy).toBe(2)
    
        // notify outer effect to run
        obj.prop = 3
        expect(dummy).toBe(3)
      })

      it('scheduler', () => {
        let dummy
        let run: any
        const scheduler = jest.fn(() => {
          run = runner
        })
        const obj = reactive({ foo: 1 })
        const runner = effect(
          () => {
            dummy = obj.foo
          },
          { scheduler }
        )
        expect(scheduler).not.toHaveBeenCalled()
        expect(dummy).toBe(1)
        // should be called on first trigger
        obj.foo++
        expect(scheduler).toHaveBeenCalledTimes(1)
        // should not run yet
        expect(dummy).toBe(1)
        // manually run
        run()
        // should have run
        expect(dummy).toBe(2)
      })
})