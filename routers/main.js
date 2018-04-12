let express = require('express');
let router = express.Router();
let Category = require('../models/category');
let Content = require('../models/content');
//处理通用的数据
let data;

router.use(function (req,res,next) {
    data={
        userInfo:req.userInfo,
        categories:[]
    };
    Category.find().then(function (categories) {
        data.categories=categories;
        next();
    })
});

router.get('/', function (req, res, next) {
    //将点击的分类保存在变量中，以便传给前端使用
    data.category = req.query.category || '';
    data.limit  =  2;
    data.pages = 0;
    data.page = Number(req.query.page || 1);
    data.count = 0;

    let where={};
    //点击分类到不同的页面
    if(data.category){
        where.category=data.category;
    }
    Content.where(where).count().then(function (count) {
        data.count = count;
        data.pages = Math.ceil(data.count/data.limit);
        data.page = Math.min(data.page,data.pages);
        data.page = Math.max(data.page,1);

        let skip=(data.page-1)*data.limit;


        return Content.where(where).find().limit(data.limit).skip(skip).populate(['category','user']);

    }).then(function (contents) {
        data.contents=contents;
        //console.log(data)
        res.render('main/index', data);
    });
    // console.log(req.userInfo)

});

//处理点击阅读全文之后的页面
router.get('/view',function (req,res) {
    let contentId=req.query.content;
    Content.findOne({
       _id:contentId
    }).then(function (content) {
        data.content=content;
        content.view += 1;
        content.save();
        console.log(content);
        res.render('main/view',data);
    });
});

module.exports = router;