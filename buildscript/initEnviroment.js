/**
 * Created by qingcheng on 2017/05/15.
 */
var path = require('path'),
    //指定frontend工程目录路径
    root = path.resolve('./'),
    fs = require('fs'),
    argv;

try {
    argv = process.argv.splice(2);
    if (argv.length) {
	    updateEnviroment(argv);
    }else {
	    console.error('请输入环境信息!');
    }
} catch (ex) {
    console.error(ex.message);
}

function updateEnviroment(d) {
	var data = {
		'domianName': d[0],
		'projectName': d[1],
		'module': d[2]
	};
    fs.writeFile(root + '/environment-domain.json', JSON.stringify(data));
}
