let http=require('http')
let finalhandler=require('finalhandler')
class MyExpress{
    use(path,handle){
        if(arguments.length===0){
            throw Error('miss arguments');
        }
        //如果参数的个数为1时，则表示传入的为方法
        if(arguments.length===1){
            handle=path
            path='/'
        }
        //创建唯一的router对象
        if (!this.router) {
            this.router = new Router();
        }
        //将调用router.use
        this.router.use(path, handle);
    }
    listen(){
        //实际上listen
        let server=http.createServer(this._handle.bind(this))
        return server.listen.apply(server, arguments);
    }
    _handle(req, res){
        const done = finalhandler(req, res);
        if (!this.router) {
          done();
          return;
        }
        this.router.handle(req, res, done)
    }
}
class Router{ 
    constructor(){
        //用于存放中间件
        this.stack=[]
    }
    use(path,handle){
        //将path和handle封装成一个layer对象，然后将封装好的layer传入stack中
        let layer=new Layer(path,handle)
        this.stack.push(layer)

    }
    //执行中间件
    handle(req,res,done){
        let index=0
        let stacks=this.stack
        let self=this

        next();

        function next(error){
             // 迭代完所有中间件后执行done逻辑
             if(index>=stacks.length){
                  done(error)
                  return
             }
             //用于记录当前中间件
             let layer
             //用于
             let isMatch
             //取出匹配的中间件
            while(!isMatch && index < stacks.length) {
                layer = stacks[index++];
                isMatch = self.matchMiddleware(req.url, layer.path);
            }
             // 迭代完发现没有任何匹配的中间件则直接done
            if (!isMatch) {
                done(error);
                return;
            }
            if (error) {
                layer.handleError(error, layer.handle, req, res, next);
            } else {
                layer.handleRequest(layer.handle, req, res, next);
            }
        
        }

       
    }
    // 最基本的中间件是否匹配的逻辑
    matchMiddleware(url, path) {
        return url.slice(0, path.length) === path;
    }
}
class Layer{
    constructor(path, fn, ops){
        this.path=path
        this.handle=fn
        this.ops=ops||{}
    }

    handleError(error,fn,req,res,next){
        // 如果不是错误处理中间件则跳过
        if (fn.length !== 4) {
            next();
            return;
        }
        try {
            fn(error, req, res, next);
        } catch (error) {
            next(error);
        }
    }


    // 调用请求处理中间件
  handleRequest(fn, req, res, next) {
        // 如果不是普通中间件则跳过
    if (fn.length !== 3) {
        next();
        return;
    }
    try {
        fn(req, res, next);
    } catch (error) {
        next(error);
    }
  }

}



const app = new MyExpress();

// /a路由处理
app.use('/a', (req, res, next) => {
  res.end(res.reqTime);
  next();
});

// /b的路由处理
app.use('/b', (req, res, next) => {
  throw Error('/b error');
});

// 错误处理中间件
app.use((error, req, res, next) => {
  res.writeHead(error.status || 500);
  res.end('server error');
});

app.listen(3333, () => {
  console.log('express is running at port 3000');
});
