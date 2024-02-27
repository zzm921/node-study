let PENDING = 'pending'
let FULFILLED = 'fulfilled'
let REJECTED = 'rejected'
function MyPromise(executor){
    this.state=PENDING
    this.value= null
    this.reason=null

    this.onFulfilledCallbacks=[]
    this.onRejectedCallbacks=[]

    function resolve(value){
        this.value=value
        this.state=FULFILLED
        for(let onFulfilledCallback of this.onFulfilledCallbacks){
            onFulfilledCallback(value)
        }
    }
    function reject(reason){
        this.reason=reason
        this.state=REJECTED
        for(let onRejectedCallback of this.onRejectedCallbacks){
            onRejectedCallback(reason)
        }
    }
    try {
        executor(resolve,reject)
    } catch (error) {
        reject(error)
    }
}

MyPromise.prototype.then=function(onResolve,onReject){
    let that=this
    let promise2= new MyPromise((resolve,reject)=>{
        if(that.state===FULFILLED){
            setTimeout(() => {
                let x=onResolve(that.reason)
                MyPromise.resolvePromise(promise2,x,resolve,reject)
            }, 0);
          
        }else if(that.state===REJECTED){
            setTimeout(() => {
                let x=onReject(that.reason)
                MyPromise.resolvePromise(promise2,x,resolve,reject)
            }, 0);
          
        } else if(that.state===PENDING){
            that.onFulfilledCallbacks.push(function(value){
                setTimeout(() => {
                    let x=onResolve(value)
                    MyPromise.resolvePromise(promise2,x,resolve,reject)
                }, 0);
               
            })

            that.onRejectedCallbacks.push(function(reason){
                setTimeout(() => {
                    let x=onReject(reason)
                    MyPromise.resolvePromise(promise2,x,resolve,reject)
                }, 0);
            })
        } 

    })
}

MyPromise.resolvePromise=function(promise2,x,resolve,reject){
    let called=false //用于记录该方法是否已经被执行过，确保只执行一次
    if(promise2===x){
        throw Error()
    }
    //如果x是一个promise，则取这个promise.then的值继续执行
    if(x instanceof MyPromise){ 
        return x.then((value)=>{
        
            if (called) return;
            called = true;
            MyPromise.resolvePromise(promise2,value,resolve,reject)
        },(reason)=>{
            reject(reason)
        })
    }else if(x!==null&&(typeof x==='object'||typeof x==='function')){ //如果是对象或者函数，则查看这个对象是否有。then方法，有则执行
        let then=x.then
        if(typeof then==='function'){
            return then.call(x,(value)=>{
                if (called) return;
                called = true;
                MyPromise.resolvePromise(promise2,value,resolve,reject)
            },(reason)=>{
                reject(reason)
            })
        }else{
            if(called) return
            called=true
            resolve(x)
        }
    }else{
        if(called) return
        called=true
        resolve(x)
    }



}



































function Promise(executor){
    this.state=PENDING
    this.data=undefined
    this.reason=undefined
    this.onFulfilledCallbacks=[]
    this.onRejectedCallbacks=[]
    let self=this

    function resolve(value){
        self.state=FULFILLED
        self.data=value
        for(let resolvedCallback of self.onFulfilledCallbacks){
            resolvedCallback(value)
        }
    }

    function reject(reason){
        self.state=REJECTED
        self.reason=reason
        for(let rejectedCallback of self.onRejectedCallbacks){
            rejectedCallback(reason)
        }
    }

    try {
        executor(resolve,reject)
    } catch (error) {
        reject(error)
    }
}

Promise.prototype.then=function(onResolve,onReject){
    let self=this
    if(typeof onReject !=='function'){
        onReject=function(reason){
            throw reason
        }
    }
    if(typeof onResolve !=='function'){
        onResolve=function(value){
            return value
        }
    }
    let promise2=new Promise((resolve,reject)=>{
        if(this.state===FULFILLED){
            setTimeout(() => {
                let x=onResolve(self.data)
                Promise.resolvePromise(promise2,x,resolve,reject)
            }, 0);
        }
    
        if(this.state===REJECTED){
            setTimeout(() => {
                let x=onReject(self.reason)
                Promise.resolvePromise(promise2,x,resolve,reject)
            }, 0);
           
        }
    
        if(this.state===PENDING){
            this.onFulfilledCallbacks.push((value)=>{
                setTimeout(() => {
                    let x=onResolve(value)
                    Promise.resolvePromise(promise2,x,resolve,reject)
                }, 0);
               
            })

            this.onRejectedCallbacks.push((reason)=>{
                setTimeout(() => {
                    let x=onResolve(reason)
                    Promise.resolvePromise(promise2,x,resolve,reject)
                }, 0);
            })
            
        }
    })
    return promise2
}

Promise.resolvePromise=function(promise2,x,resolve,reject){
     // x 与 promise2 相等
     if (promise2 === x) {
        reject(new TypeError('chainning cycle detected for promise'))
      }
    if(x instanceof Promise){
        x.then((value)=>{
            Promise.resolvePromise(promise2,value,resolve,reject)
        }, reason => {
            reject(reason)
          })
    }else if(x !== null && (typeof x === 'object' || typeof x === 'function')){
        let then=x.then
        if (typeof then === 'function') {
            then.call(
              x,
              value => {
                if (called) return
                called = true
                Promise.resolvePromise(promise2, value, resolve, reject)
              },
              reason => {
                if (called) return
                called = true
                reject(reason)
              }
            )
          } else {
            if (called) return
            called = true
            resolve(x)
          }
    }else{
        resolve(x)
    }

}


const promise = new Promise((resolve, reject) => {
        console.log(1)
        setTimeout(() => {
            console.log(4)
            resolve(6)
            console.log(5)
        })
        console.log(2)
}).then(value => {
        console.log(value, 'value')
        return new Promise(resolve => {
            resolve(new Promise(resolve3 => {
            resolve3(7)
            }))
        })
    },reason => {
        console.log(reason, 'reason')
}).then(
        value => {
            console.log(value, 'vvvvvvvvvvvv')
        }, reason => {
            console.log(reason)
    })
console.log(3)