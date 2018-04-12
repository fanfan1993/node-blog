let express=require('express');
let router=express.Router();
let User = require('../models/user');//应用数据库
let Content = require('../models/content');
//let query = require('../models/Pool');
//统一返回格式
let responseDate;


// router.get('/user',function (req,res,next) {
//     res.send('API - User');
// });

router.use(function (req,res,next) {
   responseDate={
       code:0,
       message:'',
   };
   next();
});
/*用户注册
	注册逻辑
	1、用户名、密码不能为空
	2、两次输入密码必须一致
	3、用户名是否已经被注册（数据库）*/
router.post('/user/register',function (req,res,next) {
   //console.log(req.body);
    let username = req.body.username;
    let password = req.body.password;
    let repassword = req.body.repassword;
    if(username==''){
        responseDate.code=1;
        responseDate.message='用户名不能为空';
        res.json(responseDate); //返回给前段
        return;
    }
    //判断密码
    else if(password==''){
        responseDate.code=1;
        responseDate.message='密码不能为空';
        res.json(responseDate);
        return;
    }
    //判断两次密码是否一致
    else if(password!=repassword){
        responseDate.code=1;
        responseDate.message='两次输入的密码不同';
        res.json(responseDate);
        //return;
    }
//查找用户名与数据库中的用户名是否重合
    //数据库操作，将其当做对象处理,findone返回的是一个promise对象
    else{
        User.findOne({
            username:username
        }).then(function (userInfo) {
            // console.log(userInfo);
            if(userInfo){
                //表示数据库中有重复的用户注册信息
                responseDate.code = 4;
                responseDate.message = '用户名已经被注册';
                res.json(responseDate);
                // return;
            }
            //保存用户注册的信息到数据库中
            else{
                let user = new User({
                    username:username,
                    password:password
                });
                return user.save();  //保存
            }

        }).then(function (newUserInfo) {
            //保存成功后调用then的方法
             console.log(newUserInfo);
            responseDate.message = '注册成功';
            res.json(responseDate);
        });
    }
});

/*用户登录
	登录逻辑
	查找数据库用户名和密码一致则登录成功*/
// router.post('/user/login',function(req,res){
//     let username = req.body.username;
//     let pwd= req.body.pwd;
//
//     if(username==''||pwd==''){
//         responseDate.code=1;
//         responseDate.message='用户名和密码不能为空';
//         res.json(responseDate);
//         return;
//     }
// //用户登录
//     // let sql = 'SELECT * FROM users WHERE username=? AND pwd=?';
//     // let param= [username,pwd];
//     // query(sql,param,function(err,rs,fields){
//     //
//     //     if(Object.prototype.toString.call(rs) === '[object Array]' && rs.length === 0){
//     //         responseDate.code=2;
//     //         responseDate.message='登录失败，请输入正确的用户名和密码！';
//     //         res.json(responseDate);
//     //         return;
//     //     }else{
//     //         responseDate.message='登录成功';
//     //         responseDate.myusername=username;
//     //         //用户每次访问这个网站会吧用户信息给补全输出
//     //         req.cookies.set('userInfo',JSON.stringify({
//     //             id:rs[0].id,
//     //             myusername:username,
//     //             isAdmin:Boolean(rs[0].isAdmin)
//     //
//     //         }));
//     //         res.json(responseDate);
//     //         return;
//     //     }
//     // });
// });

router.post('/user/login',function (req,res,next) {
    // console.log(req.body);
    let  username = req.body.username;
    let  password = req.body.password;

    if (username == '' || password == ''){
        responseDate.message = '用户名或者密码不能为空';
        responseDate.code = 1;
        res.json(responseDate);
    }
    else{
        User.findOne({
            username:username,
            password:password
        }).then(function (userinfo) {
            if(userinfo){
                // console.log(userinfo);
                responseDate.message = '登录成功';
                responseDate.info ={
                    username:userinfo.username,
                    id:userinfo._id
                };
                //发送cookie至浏览器,将用户名使用字符串的形式保存在userinfo中
                req.cookies.set('userInfo',JSON.stringify(responseDate.info));
                res.json(responseDate);
                return;
            }

            responseDate.code = 2;
            responseDate.message = '用户名或密码出错，登录失败';
            res.json(responseDate);
        })
    }
});

/*退出
*/
router.get('/user/logout',function(req,res){
    req.cookies.set('userInfo',null);
    res.json(responseDate);
})

/*
处理评论数据*/
router.post('/comment',function (req,res) {
    Content.findById(req.body.contentid).then(function (info) {
        //在数据库中的comments字段中将提交过来的评论保存
        info.comments.push(req.body);
        //保存在数据中,数据库的保存是对整个数据库对象操作
        return info.save();
    }).then(function (newinfo) {
        responseDate.comments = newinfo.comments.reverse();
        responseDate.message = '评论保存成功';
        res.json(responseDate);
    })
});
//处理一进来就显示所有的评论
router.get('/comment',function (req,res) {
    //ajax传过来的参数在query中
    Content.findById(req.query.contentid).then(function (info) {
        // console.log(info);
        responseDate.comments = info.comments.reverse();
        res.json(responseDate);
    })
});
module.exports=router;