/*
*
*  yf 2018-4-5
*  应用文件启动路口
* */
// 加载express模块
let express=require('express');

let swig = require('swig');

let mongoose=require('mongoose'); //加载数据库模块
let bodyParser=require('body-parser');//body-parser 处理post提交的数据


let Cookies = require('cookies');//加载cookie模块


let app=express();//创建app应用=>node HTTP.createSever()

let User=require("./models/user");

//设置静态文件托管(如css,js)
//当用户访问的url以/public开始，那么直接返回对应__dirname + '/public'下的文件
app.use('/public',express.static(__dirname + '/public'));

/*配置应用模板
  定义一个参数：模板引擎的名称，模板文件的后缀
     第2个参数用于 解析模板内容的方法
* */
app.engine('html',swig.renderFile);

//设置模板文件存放的目录，第一个参数必须是views，第二个参数是目录
app.set('views','./view'); //模板文件存放目录
app.set('view engine','html');
//注册模板；一个必须view engine,第二个必须是app.engine中第一个参数相同

swig.setDefaults({cache:false}); //在开发过程中，需要取消模板缓存（改动立马刷新）
app.use(bodyParser.urlencoded({extended:true}));//bodyParser配置

//设置cookie
//设置cookie
app.use(function (req,res,next) {
    req.cookies = new Cookies(req,res);
    //浏览器在发送请求时，会把cookie一起放在header里发过来
    //获得cookie，以便显示在前端以及后端数据库的搜索等
    req.userInfo = {};
    if(req.cookies.get('userInfo')){
        //防止出现不必要的错误
        try {
            req.userInfo = JSON.parse(req.cookies.get('userInfo'));

            //不在cookie里面存放关于管理员的信息，而是每次都通过cookie信息去数据库里判断此人是不是管理员
            // User.findOne({
            //     username:req.userInfo.username
            // }).then(function (userInfo) {
            //     //将管理员信息添加在req.userInfo，方便前端使用
            //     req.userInfo.isAdmin = userInfo.isAdmin;
            //     // console.log(req.userinfo);
            //     next();
            //     return;
            // });
            // console.log(req.userinfo);
            User.findById(req.userInfo.id).then(function (userInfo) {
                //console.log(req.userInfo)
                req.userInfo.isAdmin=Boolean(userInfo.isAdmin);
                next();
            })
        }catch(e){
            next();
        }
    }else{
        next();
    }
    // console.log( typeof req.cookies.get('userinfo'));
});

/*
* 首页
*  req request对象
*  res response 对象
*  next 函数
* */
// app.get('/',function (req,res,next) {
//    // res.send('<h1>欢迎光临我的博客！</h1>')
//     /*
//     * 读取views目录下制定文件，解析返回给客户端
//     * 第一个参数：表示模块的文件，相对于views目录 view/index.html
//     * 第二个参数：传递给模块使用的数据
//     * */
//      res.render('index')
// });

//划分模块，将模块划分为前端模块，后台模块，api模块
app.use('/',require('./routers/main'));
app.use('/admin',require('./routers/admin'));
app.use('/api',require('./routers/api'));


//监听htttp请求
mongoose.connect('mongodb://localhost:27018/blog',function (err) {
    if(err){
        console.log("数据库链接失败");
    }else{
        console.log('数据库链接成功')

        app.listen(8081);
    }
});
//app.listen(8081);