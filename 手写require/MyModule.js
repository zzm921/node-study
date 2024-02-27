let path=require("path")
function MyModule(id=''){
    this.id = id;       // 这个id其实就是我们require的路径
    this.path = path.dirname(id);     // path是Node.js内置模块，用它来获取传入参数对应的文件夹路径
    this.exports = {};        // 导出的东西放这里，初始化为空对象
    this.filename = null;     // 模块对应的文件名
    this.loaded = false;      // loaded用来标识当前模块是否已经加载
}

// 
MyModule.prototype.require=function(id){
    return MyModule._load(id)
}



//记录模块缓存
MyModule._cache = Object.create(null);


// 先检查请求的模块在缓存中是否已经存在了，如果存在了直接返回缓存模块的exports。
// 如果不在缓存中，就new一个Module实例，用这个实例加载对应的模块，并返回模块的exports。
MyModule._load=function(request){ // request是我们传入的路劲参数
    const filename = MyModule._resolveFilename(request);
    //先检查缓存是否存在,如果缓存存在就直接返回缓存
    let cachedModule=MyModule._cache[filename]
    if (cachedModule !== undefined) {
        return cachedModule.exports;
    }

    // 如果缓存不存在，我们就加载这个模块
    // 加载前先new一个MyModule实例，然后调用实例方法load来加载
    // 加载完成直接返回module.exports
    let module=new MyModule(filename)

    // load之前就将这个模块缓存下来，这样如果有循环引用就会拿到这个缓存，但是这个缓存里面的exports可能还没有或者不完整
    MyModule._cache[filename] = module;
    module.load(filename);
    return module.exports;
}

/**
 * 
 * @param {*} request 
 * MyModule._resolveFilename从名字就可以看出来，这个方法是通过用户传入的require参数来解析到真正的文件地址的.
 * 源码中这个方法比较复杂，因为按照前面讲的，他要支持多种参数：内置模块，相对路径，绝对路径，文件夹和第三方模块等等，如果是文件夹或者第三方模块还要解析里面的package.json和index.js。
 * 我们这里主要讲原理，所以我们就只实现通过相对路径和绝对路径来查找文件，并支持自动添加js和json两种后缀名:
 */
 MyModule._resolveFilename = function(request){
    const filename = path.resolve(request);   // 获取传入参数对应的绝对路径
    const extname = path.extname(request);    // 获取文件后缀名
  
    // 如果没有文件后缀名，尝试添加.js和.json
    if (!extname) {
      const exts = Object.keys(MyModule._extensions);
      for (let i = 0; i < exts.length; i++) {
        const currentPath = `${filename}${exts[i]}`;
  
        // 如果拼接后的文件存在，返回拼接的路径
        if (fs.existsSync(currentPath)) {
          return currentPath;
        }
      }
    }
    return filename;
  }

/**
 * MyModule.prototype.load是一个实例方法，这个方法就是真正用来加载模块的方法，这其实也是不同类型文件加载的一个入口，不同类型的文件会对应MyModule._extensions里面的一个方法：
 * @param {*} id 
 */
MyModule.prototype.load=function(filename){
    // 获取文件后缀名
    const extname = path.extname(filename);

    // 调用后缀名对应的处理函数来处理
    MyModule._extensions[extname](this, filename);

    this.loaded = true;
}

MyModule._extensions['.json'] = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    module.exports = JSONParse(content);
}

MyModule._extensions['.js'] = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    module._compile(content, filename);
}

MyModule.wrapper = [
    '(function (exports, require, module, __filename, __dirname) { ',
    '\n});'
]
MyModule.wrap = function (script) {
    return MyModule.wrapper[0] + script + MyModule.wrapper[1];
};
/**
 * MyModule.prototype._compile是加载JS文件的核心所在，也是我们最常使用的方法，这个方法需要将目标文件拿出来执行一遍，执行之前需要将它整个代码包裹一层，以便注入exports, require, module, __dirname, __filename，这也是我们能在JS文件里面直接使用这几个变量的原因。
 * this:compiledWrapper是通过call调用的，第一个参数就是里面的this，这里我们传入的是this.exports，也就是module.exports，也就是说我们js文件里面this是对module.exports的一个引用。
 * exports: compiledWrapper正式接收的第一个参数是exports，我们传的也是this.exports,所以js文件里面的exports也是对module.exports的一个引用。
 * require: 这个方法我们传的是this.require，其实就是MyModule.prototype.require，也就是MyModule._load。
 * module: 我们传入的是this，也就是当前模块的实例。
 * __filename：文件所在的绝对路径。
 * __dirname: 文件所在文件夹的绝对路径。
 * @param {*} content 
 * @param {*} filename 
 */
MyModule.prototype._compile=function(content,filename){
    const wrapper = MyModule.wrap(content);    // 获取包装后函数体

    // vm是nodejs的虚拟机沙盒模块，runInThisContext方法可以接受一个字符串并将它转化为一个函数
    // 返回值就是转化后的函数，所以compiledWrapper是一个函数
    const compiledWrapper = vm.runInThisContext(wrapper, {
      filename,
      lineOffset: 0,
      displayErrors: true,
    });
  
    // 准备exports, require, module, __filename, __dirname这几个参数
    // exports可以直接用module.exports，即this.exports
    // require官方源码中还包装了一层，其实最后调用的还是this.require
    // module不用说，就是this了
    // __filename直接用传进来的filename参数了
    // __dirname需要通过filename获取下
    const dirname = path.dirname(filename);
    compiledWrapper.call(this.exports, this.exports, this.require, this, filename, dirname);
}

