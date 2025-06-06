// 数据文件路径
const DATA_FILES = {
    abbreviation: './data/abbreviations.json',
    vocabulary: './data/vocabularies.json',
    organization: './data/organizations.json'
};

// 全局数据结构
let dictData = {
    abbreviation: [],
    vocabulary: [], 
    organization: []
};

// 直接内联的 JSON 数据
// const vocabulariesData = [ /* 这里粘贴 vocabularies.json 的内容 */ ];
// const organizationsData = [ /* 这里粘贴 organizations.json 的内容 */ ];
// const lawsData = [ /* 这里粘贴 laws.json 的内容 */ ];
let currentView = 'welcome'; // welcome | en-cn | cn-en | search
let currentCategory = 'welcome';
let currentLetter = '';
let bookmarks = [];
let history = [];
let settings = {
    autoSearch: true
};

// 工具：首字母大写
function upperFirst(str) {
    return str && str[0] ? str[0].toUpperCase() : '';
}

// 加载本地设置
function loadSettings() {
    try {
        const s = localStorage.getItem('aml_dict_settings');
        if (s) settings = { ...settings, ...JSON.parse(s) };
    } catch (e) { }
    document.getElementById('autoSearch').checked = settings.autoSearch;
}

// 保存设置
function saveSettings() {
    localStorage.setItem('aml_dict_settings', JSON.stringify(settings));
}

// 加载书签和历史
function loadLocalLists() {
    try {
        const b = localStorage.getItem('aml_dict_bookmarks');
        if (b) bookmarks = JSON.parse(b);
        const h = localStorage.getItem('aml_dict_history');
        if (h) history = JSON.parse(h);
    } catch (e) { }
}

// 保存书签和历史
function saveLocalLists() {
    localStorage.setItem('aml_dict_bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('aml_dict_history', JSON.stringify(history));
}

// 加载所有数据
async function loadAllData() {
    console.log('开始加载数据...');
    try {
        // 使用同步的 XMLHttpRequest 加载数据
        for (const key in DATA_FILES) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', DATA_FILES[key], false); // 同步请求
            xhr.send();
            
            if (xhr.status === 200) {
                const arr = JSON.parse(xhr.responseText);
                console.log(`成功加载 ${key} 数据，条目数: ${arr.length}`);
                dictData[key] = arr;
            } else {
                console.error(`加载 ${key} 数据失败: ${xhr.status} ${xhr.statusText}`);
                dictData[key] = [];
            }
        }
    } catch (e) {
        console.error('加载数据时出错:', e);
    }
    console.log('数据加载完成', dictData);
}

// 动态分组函数，兼容空值，首字母只取 A-Z
function groupByLetter(data, mode, key) {
    const grouped = {};
    data.forEach(item => {
        let letter = '';
        if (mode === 'cn-en') { // 汉英对照，按中文拼音首字母
            let cn = '';
            if (key === 'abbreviation') cn = item.abbr_cn;
            else if (key === 'vocabulary') cn = item.cn;
            else if (key === 'organization') cn = item.org_cn;
            // 类型保护，防止递归溢出，只处理包含中文的字符串
            if (typeof cn !== 'string' || !cn.trim()) {
                letter = '';
            } else {
                // 处理中文和非中文混合的情况
                const firstChar = cn[0];
                if (/[\u4e00-\u9fa5]/.test(firstChar)) {
                    // 简单拼音首字母实现 - 常用汉字映射表
                    const pinyinMap = {
                       '一':'Y','万':'W','三':'S','上':'S','下':'X','不':'B','与':'Y','专':'Z','世':'S','业':'Y','东':'D','两':'L','严':'Y','个':'G','中':'Z','临':'L','为':'W','主':'Z','举':'J','义':'Y','之':'Z','乘':'C','也':'Y','习':'X','书':'S','买':'M','了':'L','予':'Y','事':'S','于':'Y','互':'H','五':'W','亚':'Y','交':'J','产':'C','享':'X','亲':'Q','人':'R','介':'J','从':'C','他':'T','付':'F','代':'D','令':'L','以':'Y','仪':'Y','件':'J','价':'J','任':'R','份':'F','仿':'F','企':'Q','伊':'Y','休':'X','众':'Z','优':'Y','伙':'H','会':'H','传':'C','伤':'S','伪':'W','估':'G','伴':'B','伸':'S','似':'S','位':'W','低':'D','体':'T','余':'Y','作':'Z','你':'N','佣':'Y','佳':'J','使':'S','例':'L','供':'G','依':'Y','侦':'Z','侵':'Q','保':'B','信':'X','修':'X','倒':'D','候':'H','借':'J','倡':'C','债':'Z','值':'Z','假':'J','偏':'P','停':'T','健':'J','偶':'O','偷':'T','偿':'C','储':'C','像':'X','元':'Y','充':'C','先':'X','克':'K','免':'M','兑':'D','党':'D','入':'R','全':'Q','公':'G','兰':'L','共':'G','关':'G','兴':'X','其':'Q','具':'J','典':'D','养':'Y','兼':'J','内':'N','册':'C','再':'Z','冒':'M','写':'X','军':'J','农':'N','冲':'C','决':'J','况':'K','冻':'D','净':'J','准':'Z','减':'J','凡':'F','凭':'P','出':'C','击':'J','函':'H','分':'F','切':'Q','刑':'X','划':'H','列':'L','则':'Z','创':'C','初':'C','判':'P','利':'L','别':'B','到':'D','制':'Z','券':'Q','前':'Q','剩':'S','割':'G','剽':'P','力':'L','劝':'Q','办':'B','加':'J','务':'W','动':'D','助':'Z','劫':'J','劳':'L','势':'S','勉':'M','勒':'L','募':'M','勤':'Q','包':'B','化':'H','北':'B','区':'Q','医':'Y','匿':'N','十':'S','华':'H','协':'X','单':'D','卖':'M','南':'N','博':'B','卡':'K','卧':'W','卫':'W','印':'Y','危':'W','即':'J','卷':'J','厂':'C','原':'Y','厥':'J','去':'Q','参':'C','及':'J','双':'S','反':'F','发':'F','取':'Q','受':'S','变':'B','叙':'X','口':'K','古':'G','可':'K','台':'T','号':'H','司':'S','各':'G','合':'H','吊':'D','同':'T','名':'M','后':'H','向':'X','吞':'T','听':'T','吸':'X','告':'G','员':'Y','周':'Z','命':'M','和':'H','咨':'Z','品':'P','哈':'H','响':'X','唆':'S','售':'S','唯':'W','商':'S','善':'S','嘱':'Z','器':'Q','四':'S','回':'H','因':'Y','团':'T','围':'W','固':'G','国':'G','图':'T','圆':'Y','在':'Z','地':'D','场':'C','圾':'J','均':'J','坏':'H','块':'K','坛':'T','坡':'P','坦':'T','垃':'L','型':'X','埃':'A','城':'C','域':'Y','培':'P','基':'J','堂':'T','堡':'B','塔':'T','塞':'S','境':'J','增':'Z','士':'S','声':'S','壳':'K','处':'C','备':'B','复':'F','外':'W','多':'D','大':'D','天':'T','太':'T','夫':'F','央':'Y','失':'S','头':'T','套':'T','姆':'M','委':'W','威':'W','媒':'M','嫌':'X','子':'Z','字':'Z','存':'C','守':'S','安':'A','完':'W','宗':'Z','官':'G','定':'D','宝':'B','实':'S','审':'S','客':'K','宣':'X','室':'S','宪':'X','害':'H','家':'J','容':'R','宽':'K','寄':'J','密':'M','察':'C','对':'D','导':'D','寿':'S','封':'F','射':'S','小':'X','少':'S','尔':'E','尽':'J','局':'J','层':'C','居':'J','展':'Z','属':'S','履':'L','岗':'G','岸':'A','巡':'X','工':'G','差':'C','巴':'B','币':'B','市':'S','布':'B','师':'S','带':'D','席':'X','帮':'B','常':'C','幌':'H','幕':'M','干':'G','平':'P','年':'N','并':'B','广':'G','庄':'Z','序':'X','库':'K','应':'Y','底':'D','府':'F','庞':'P','废':'F','度':'D','座':'Z','庭':'T','康':'K','廉':'L','延':'Y','廷':'T','建':'J','开':'K','异':'Y','式':'S','引':'Y','弱':'R','强':'Q','当':'D','录':'L','形':'X','彩':'C','影':'Y','往':'W','征':'Z','律':'L','得':'D','御':'Y','微':'W','德':'D','心':'X','必':'B','忘':'W','快':'K','忽':'H','怀':'H','态':'T','怖':'B','急':'J','性':'X','总':'Z','恐':'K','息':'X','情':'Q','惠':'H','惩':'C','惯':'G','意':'Y','感':'G','愿':'Y','慈':'C','慎':'S','成':'C','戒':'J','或':'H','战':'Z','截':'J','户':'H','房':'F','所':'S','手':'S','扒':'B','打':'D','托':'T','扣':'K','执':'Z','扩':'K','扰':'R','批':'P','承':'C','技':'J','投':'T','抗':'K','折':'Z','抛':'P','抢':'Q','护':'H','报':'B','披':'P','抵':'D','押':'Y','担':'D','拆':'C','拉':'L','拍':'P','拒':'J','拖':'T','拘':'J','拟':'N','拥':'Y','拦':'L','拨':'B','择':'Z','持':'C','挂':'G','指':'Z','按':'A','挪':'N','捐':'J','捕':'B','损':'S','换':'H','据':'J','授':'S','掉':'D','排':'P','接':'J','控':'K','推':'T','掩':'Y','措':'C','提':'T','援':'Y','搜':'S','携':'X','摘':'Z','撤':'C','播':'B','操':'C','支':'Z','收':'S','改':'G','放':'F','政':'Z','故':'G','效':'X','敏':'M','救':'J','教':'J','敞':'C','散':'S','数':'S','敲':'Q','整':'Z','文':'W','斗':'D','料':'L','斥':'C','断':'D','斯':'S','新':'X','方':'F','施':'S','旅':'L','无':'W','日':'R','时':'S','明':'M','易':'Y','是':'S','显':'X','晤':'W','普':'P','景':'J','智':'Z','暂':'Z','暴':'B','更':'G','替':'T','最':'Z','有':'Y','朋':'P','服':'F','朗':'L','期':'Q','未':'W','本':'B','术':'S','机':'J','杀':'S','杂':'Z','权':'Q','村':'C','束':'S','条':'T','来':'L','极':'J','构':'G','析':'X','果':'G','枪':'Q','架':'J','柜':'G','查':'C','标':'B','样':'Y','核':'H','根':'G','格':'G','框':'K','案':'A','桌':'Z','档':'D','梅':'M','械':'X','检':'J','槛':'K','模':'M','欠':'Q','次':'C','欧':'O','欺':'Q','款':'K','止':'Z','正':'Z','步':'B','武':'W','歧':'Q','殊':'S','段':'D','毒':'D','比':'B','毫':'H','氏':'S','民':'M','水':'S','求':'Q','汇':'H','污':'W','汽':'Q','沃':'W','没':'M','治':'Z','泄':'X','法':'F','注':'Z','洗':'X','洛':'L','洞':'D','洲':'Z','活':'H','派':'P','流':'L','测':'C','济':'J','海':'H','消':'X','涉':'S','淆':'X','淫':'Y','深':'S','混':'H','清':'Q','渠':'Q','渡':'D','港':'G','游':'Y','湾':'W','源':'Y','溢':'Y','溯':'S','滥':'L','漏':'L','潜':'Q','澳':'A','火':'H','点':'D','然':'R','照':'Z','熟':'S','爱':'A','版':'B','物':'W','牵':'Q','特':'T','犯':'F','状':'Z','独':'D','献':'X','玉':'Y','环':'H','现':'X','珠':'Z','班':'B','球':'Q','理':'L','瑞':'R','瓦':'W','生':'S','用':'Y','由':'Y','申':'S','电':'D','界':'J','留':'L','略':'L','疑':'Y','疗':'L','痕':'H','登':'D','白':'B','的':'D','皮':'P','益':'Y','监':'J','盖':'G','盗':'D','盟':'M','目':'M','直':'Z','相':'X','真':'Z','眠':'M','督':'D','瞒':'M','知':'Z','矩':'J','短':'D','石':'S','码':'M','研':'Y','破':'P','础':'C','确':'Q','磋':'C','示':'S','社':'S','神':'S','票':'P','禁':'J','福':'F','离':'L','私':'S','科':'K','秘':'M','租':'Z','秩':'Z','称':'C','移':'Y','稀':'X','程':'C','税':'S','稳':'W','稽':'J','稿':'G','究':'J','空':'K','突':'T','窃':'Q','窝':'W','立':'L','站':'Z','章':'Z','端':'D','笔':'B','符':'F','第':'D','等':'D','策':'C','筛':'S','筹':'C','简':'J','算':'S','管':'G','箱':'X','籍':'J','类':'L','精':'J','系':'X','素':'S','索':'S','紧':'J','累':'L','繁':'F','红':'H','约':'Y','级':'J','纪':'J','纯':'C','纳':'N','纵':'Z','纸':'Z','线':'X','组':'Z','细':'X','织':'Z','终':'Z','经':'J','绑':'B','结':'J','给':'G','络':'L','绝':'J','统':'T','绩':'J','续':'X','维':'W','综':'Z','绿':'L','缉':'J','缓':'H','编':'B','缩':'S','缴':'J','缺':'Q','网':'W','罗':'L','罚':'F','罪':'Z','置':'Z','署':'S','美':'M','群':'Q','翻':'F','老':'L','考':'K','者':'Z','而':'E','职':'Z','联':'L','股':'G','育':'Y','胁':'X','背':'B','能':'N','脆':'C','脸':'L','腐':'F','自':'Z','致':'Z','航':'H','般':'B','色':'S','艺':'Y','节':'J','花':'H','英':'Y','范':'F','草':'C','荐':'J','药':'Y','莫':'M','获':'H','营':'Y','著':'Z','董':'D','蒙':'M','蓄':'X','薄':'B','藏':'C','虑':'L','虚':'X','融':'R','行':'X','衍':'Y','衡':'H','补':'B','表':'B','被':'B','裁':'C','裂':'L','装':'Z','西':'X','要':'Y','见':'J','观':'G','规':'G','视':'S','解':'J','触':'C','言':'Y','誉':'Y','警':'J','计':'J','订':'D','认':'R','讨':'T','让':'R','训':'X','议':'Y','记':'J','许':'X','论':'L','讼':'S','设':'S','访':'F','证':'Z','评':'P','识':'S','诈':'Z','诉':'S','词':'C','试':'S','诚':'C','话':'H','询':'X','详':'X','诫':'J','语':'Y','误':'W','说':'S','请':'Q','诺':'N','调':'D','谅':'L','谈':'T','谋':'M','豁':'H','象':'X','负':'F','贡':'G','财':'C','责':'Z','败':'B','账':'Z','货':'H','质':'Z','贩':'F','贪':'T','购':'G','贵':'G','贷':'D','贸':'M','费':'F','贿':'H','赁':'L','赂':'L','赃':'Z','资':'Z','赌':'D','赎':'S','赔':'P','赝':'Y','赠':'Z','走':'Z','起':'Q','超':'C','趋':'Q','跟':'G','跨':'K','路':'L','践':'J','踪':'Z','身':'S','车':'C','转':'Z','轮':'L','轻':'Q','较':'J','输':'S','辖':'X','辜':'G','辩':'B','边':'B','达':'D','过':'G','运':'Y','近':'J','返':'F','还':'H','进':'J','违':'W','连':'L','迟':'C','述':'S','迹':'J','追':'Z','退':'T','送':'S','适':'S','逃':'T','选':'X','透':'T','递':'D','途':'T','通':'T','速':'S','造':'Z','逮':'D','逾':'Y','遂':'S','遏':'E','道':'D','遗':'Y','避':'B','邦':'B','邮':'Y','郎':'L','部':'B','配':'P','醉':'Z','释':'S','里':'L','重':'Z','量':'L','金':'J','鉴':'J','针':'Z','钓':'D','钞':'C','钱':'Q','银':'Y','链':'L','销':'X','键':'J','镇':'Z','长':'Z','门':'M','闭':'B','问':'W','闲':'X','间':'J','阅':'Y','阈':'Y','队':'D','防':'F','阵':'Z','阶':'J','阻':'Z','附':'F','际':'J','陆':'L','陈':'C','降':'J','限':'X','院':'Y','除':'C','险':'X','陪':'P','陷':'X','隐':'Y','障':'Z','集':'J','雇':'G','零':'L','需':'X','露':'L','非':'F','靠':'K','面':'M','革':'G','顶':'D','项':'X','顾':'G','顿':'D','预':'Y','领':'L','频':'P','题':'T','额':'E','风':'F','饰':'S','馈':'K','首':'S','验':'Y','骗':'P','骡':'L','高':'G','鱼':'Y','麻':'M','黄':'H','黎':'L','黑':'H'
                    };
                    letter = pinyinMap[firstChar] || firstChar;
                } else if (/[a-zA-Z]/.test(firstChar)) {
                    letter = firstChar.toUpperCase();
                } else {
                    letter = '';
                }
            }
        } else { // 英汉对照，按英文首字母
            if (key === 'abbreviation') letter = upperFirst(item.abbr_en || '');
            else if (key === 'vocabulary') letter = upperFirst(item.en || '');
            else if (key === 'organization') letter = upperFirst(item.org_abbr_en || '');
        }
        // 只分组到 A-Z
        if (!/^[A-Z]$/.test(letter)) return;
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(item);
    });
    return grouped;
}

// 渲染目录树，切换分类时自动初始化 currentLetter
function renderCategoryList() {
    const cats = [
        { key: 'welcome', label: '前言' },
        { key: 'abbreviation', label: '反洗钱缩略语' },
        { key: 'vocabulary', label: '反洗钱词汇' },
        { key: 'organization', label: '机构全称与缩写' }
    ];
    const ul = document.getElementById('category-list');
    ul.innerHTML = '';
    cats.forEach(cat => {
        const li = document.createElement('li');
        li.textContent = cat.label;
        li.className = 'category' + (currentCategory === cat.key ? ' active' : '');
        li.dataset.category = cat.key;
        li.onclick = function () {
            document.querySelectorAll('#category-list li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            currentCategory = cat.key;
            if (cat.key === 'welcome') {
                switchView('welcome');
            } else {
                switchView(currentView === 'cn-en' ? 'cn-en' : 'en-cn');
                const grouped = groupByLetter(dictData[cat.key] || [], currentView, cat.key);
                const letters = Object.keys(grouped).sort();
                currentLetter = letters.length ? letters[0] : '';
                renderLetterNav();
                renderContentTable();
            }
        };
        ul.appendChild(li);
    });
}

// 渲染字母导航，保证 currentLetter 始终指向有数据的首字母
function renderLetterNav() {
    const nav = document.getElementById('letter-nav');
    nav.innerHTML = '';
    if (currentCategory === 'welcome') return;
    const grouped = groupByLetter(dictData[currentCategory] || [], currentView, currentCategory);
    let letters = Object.keys(grouped).sort();
    // 如果 currentLetter 没有数据，自动切换到第一个有数据的字母
    if (!letters.includes(currentLetter)) {
        currentLetter = letters.length ? letters[0] : '';
    }
    for (let l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const li = document.createElement('li');
        li.textContent = l;
        li.className = letters.includes(l) ? 'active' : '';
        li.onclick = function () {
            if (letters.includes(l)) {
                currentLetter = l;
                renderContentTable();
                document.querySelectorAll('.letter-nav li').forEach(x => x.classList.remove('active-letter'));
                li.classList.add('active-letter');
            }
        };
        nav.appendChild(li);
    }
}

// 渲染内容区表格，保证 currentLetter 有数据
function renderContentTable() {
    const area = document.getElementById('table-area');
    const title = document.getElementById('table-title');
    const content = document.getElementById('table-content');
    area.style.display = '';
    document.getElementById('welcome-page').style.display = 'none';
    document.getElementById('search-area').style.display = 'none';
    area.classList.add('active');
    let catLabel = document.querySelector(`#category-list li.active`).textContent;
    title.textContent = catLabel + ' - ' + currentLetter;
    const grouped = groupByLetter(dictData[currentCategory] || [], currentView, currentCategory);
    let rows = grouped[currentLetter] || [];
    if (rows.length === 0) {
        content.innerHTML = '<div style="color:#888;text-align:center;">暂无数据</div>';
        return;
    }
    let html = '<table><thead><tr>';
    if (currentCategory === 'abbreviation' || currentCategory === 'organization') {
        if (currentView === 'en-cn') {
            html += '<th>缩略词（英文）</th><th>全称（英文）</th><th>中文</th><th>收藏</th></tr></thead><tbody>';
            rows.forEach(item => {
                html += '<tr><td>' + (item.abbr_en || item.org_abbr_en || '') + '</td><td>' +
                    (item.full_en || item.org_full_en || '') + '</td><td>' +
                    (item.abbr_cn || item.org_cn || '') + '</td><td>' +
                    renderBookmarkBtn(item, currentCategory, currentLetter) + '</td></tr>';
            });
        } else {
            html += '<th>中文</th><th>缩略词（英文）</th><th>全称（英文）</th><th>收藏</th></tr></thead><tbody>';
            rows.forEach(item => {
                html += '<tr><td>' + (item.abbr_cn || item.org_cn || '') + '</td><td>' +
                    (item.abbr_en || item.org_abbr_en || '') + '</td><td>' +
                    (item.full_en || item.org_full_en || '') + '</td><td>' +
                    renderBookmarkBtn(item, currentCategory, currentLetter) + '</td></tr>';
            });
        }
    } else if (currentCategory === 'vocabulary') {
        if (currentView === 'en-cn') {
            html += '<th>英文</th><th>中文</th><th>收藏</th></tr></thead><tbody>';
            rows.forEach(item => {
                html += '<tr><td>' + item.en + '</td><td>' + item.cn + '</td><td>' +
                    renderBookmarkBtn(item, currentCategory, currentLetter) + '</td></tr>';
            });
        } else {
            html += '<th>中文</th><th>英文</th><th>收藏</th></tr></thead><tbody>';
            rows.forEach(item => {
                html += '<tr><td>' + item.cn + '</td><td>' + item.en + '</td><td>' +
                    renderBookmarkBtn(item, currentCategory, currentLetter) + '</td></tr>';
            });
        }
    }
    html += '</tbody></table>';
    content.innerHTML = html;
}

// 渲染书签按钮
function renderBookmarkBtn(item, cat, letter) {
    const key = getBookmarkKey(item, cat, letter);
    if (bookmarks.includes(key)) {
        return '<button class="bookmark-btn" disabled>已收藏</button>';
    }
    return '<button class="bookmark-btn" onclick="addBookmark(\'' + encodeURIComponent(key) + '\')">收藏</button>';
}

// 书签唯一key
function getBookmarkKey(item, cat, letter) {
    let id = '';
    if (cat === 'abbreviation' || cat === 'organization') {
        id = (item.abbr_en || item.org_abbr_en || '') + '|' + (item.full_en || item.org_full_en || '') + '|' + (item.abbr_cn || item.org_cn || '');
    } else {
        id = (item.en || '') + '|' + (item.cn || '');
    }
    return cat + '|' + letter + '|' + id;
}

// 添加书签
window.addBookmark = function (key) {
    key = decodeURIComponent(key);
    if (!bookmarks.includes(key)) {
        bookmarks.unshift(key);
        if (bookmarks.length > 100) bookmarks.pop();
        saveLocalLists();
        renderBookmarks();
        renderContentTable();
        
        // 如果当前是搜索视图，也需要刷新搜索结果
        if (currentView === 'search') {
            doSearch();
        }
    }
};

// 渲染书签
function renderBookmarks() {
    const ul = document.getElementById('bookmarks-list');
    ul.innerHTML = '';
    bookmarks.forEach((key, idx) => {
        const li = document.createElement('li');
        li.textContent = bookmarkKeyToText(key);

        // 添加删除按钮
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.className = 'bookmark-del-btn';
        delBtn.onclick = function (e) {
            e.stopPropagation(); // 防止触发li的点击事件
            bookmarks.splice(idx, 1);
            saveLocalLists();
            renderBookmarks();
            
            // 如果当前是搜索视图，也需要刷新搜索结果
            if (currentView === 'search') {
                doSearch();
            }
            // 如果当前是分类视图，也需要刷新内容表格
            else if (currentView === 'en-cn' || currentView === 'cn-en') {
                renderContentTable();
            }
        };

        li.appendChild(delBtn);
        li.onclick = function () { showBookmarkDetail(key); };
        ul.appendChild(li);
    });
}

// 书签详情
function showBookmarkDetail(key) {
    alert(bookmarkKeyToText(key));
}

// 书签key转文本
function bookmarkKeyToText(key) {
    const arr = key.split('|');
    if (arr[0] === 'abbreviation' || arr[0] === 'organization') {
        if (currentView === 'en-cn') {
            return arr[2] + ' - ' + arr[3] + ' - ' + arr[4];
        } else {
            return arr[4] + ' - ' + arr[2] + ' - ' + arr[3];
        }
    } else {
        if (currentView === 'en-cn') {
            return arr[2] + ' - ' + arr[3];
        } else {
            return arr[3] + ' - ' + arr[2];
        }
    }
}

// 渲染历史记录
function renderHistory() {
    const ul = document.getElementById('history-list');
    ul.innerHTML = '';
    history.forEach((word, idx) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        const span = document.createElement('span');
        span.textContent = word;
        li.appendChild(span);

        // 添加删除按钮
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.className = 'history-del-btn';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = function (e) {
            e.stopPropagation(); // 防止触发li的点击事件
            history.splice(idx, 1);
            saveLocalLists();
            renderHistory();
        };

        li.appendChild(delBtn);
        li.onclick = function () {
            document.getElementById('searchInput').value = word;
            doSearch();
        };
        ul.appendChild(li);
    });
}

// 切换视图
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(function (btn) { btn.classList.remove('active'); });
    document.getElementById('btn-en-cn').classList.toggle('active', view === 'en-cn');
    document.getElementById('btn-cn-en').classList.toggle('active', view === 'cn-en');
    document.getElementById('btn-search').classList.toggle('active', view === 'search');
    document.getElementById('welcome-page').style.display = (view === 'welcome') ? 'block' : 'none';
    document.getElementById('table-area').style.display = (view === 'en-cn' || view === 'cn-en') ? 'block' : 'none';
    document.getElementById('search-area').style.display = (view === 'search') ? 'block' : 'none';
    if (view === 'en-cn' || view === 'cn-en') {
        renderLetterNav();
        renderContentTable();
    }
}

// 搜索功能
function doSearch() {
    const kw = document.getElementById('searchInput').value.trim();
    if (!kw) {
        renderSearchResult([]);
        return;
    }
    if (!history.includes(kw)) {
        history.unshift(kw);
        if (history.length > 100) history.pop();
        saveLocalLists();
        renderHistory();
    }
    const result = searchAllDict(kw);
    renderSearchResult(result);
}

// 搜索所有分类
function searchAllDict(keyword) {
    let result = [];
    const keywordLower = keyword.toLowerCase(); // 将搜索关键词转换为小写
    for (const cat in dictData) {
        // dictData[cat] 是数组
        dictData[cat].forEach(item => {
            let en = (item.en || item.abbr_en || item.org_abbr_en || '').toLowerCase();
            let cn = (item.cn || item.abbr_cn || item.org_cn || '').toLowerCase();
            let full = (item.full_en || item.org_full_en || '').toLowerCase();
            if (en.includes(keywordLower) || cn.includes(keywordLower) || full.includes(keywordLower)) {
                result.push({ ...item, _cat: cat });
            }
        });
    }
    return result;
}

// 渲染搜索结果
function renderSearchResult(data) {
    const countDiv = document.getElementById('search-result-count');
    const tableDiv = document.getElementById('search-result-table');
    if (!data || data.length === 0) {
        countDiv.textContent = '';
        tableDiv.innerHTML = '<div style="color:#888;text-align:center;">未找到结果</div>';
        return;
    }
    countDiv.textContent = '共 ' + data.length + ' 条结果';
    let html = '<table><thead><tr><th>英文</th><th>中文</th><th>收藏</th></tr></thead><tbody>';
    data.forEach(function (item) {
        const cat = item._cat;
        // 为搜索结果创建一个合适的字母分类
        const letter = (item.en || item.abbr_en || item.org_abbr_en || '')[0];
        const letterKey = letter && /[a-zA-Z]/.test(letter) ? letter.toUpperCase() : 'A';
        
        html += '<tr><td>' + (item.en || item.abbr_en || item.org_abbr_en || '') + '</td><td>' + 
                (item.cn || item.abbr_cn || item.org_cn || '') + '</td><td>' +
                renderBookmarkBtn(item, cat, letterKey) + '</td></tr>';
    });
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

// 事件绑定
function bindEvents() {
    document.getElementById('btn-en-cn').onclick = function () {
        switchView('en-cn');
        renderCategoryList();
    };
    document.getElementById('btn-cn-en').onclick = function () {
        switchView('cn-en');
        renderCategoryList();
    };
    document.getElementById('btn-search').onclick = function () {
        console.log('Search button clicked'); // 添加调试日志
        switchView('search');
        document.getElementById('search-area').style.display = 'block'; // 强制显示搜索区域
        document.getElementById('searchInput').focus();
        console.log('Search area display:', document.getElementById('search-area').style.display); // 检查显示状态
    };
    document.getElementById('autoSearch').onchange = function () {
        settings.autoSearch = this.checked;
        saveSettings();
    };
    document.getElementById('searchBtn').onclick = doSearch;
    document.getElementById('searchInput').oninput = function () {
        if (settings.autoSearch) doSearch();
    };
    document.getElementById('searchInput').onkeydown = function (e) {
        if (e.key === 'Enter') doSearch();
    };
    document.getElementById('clearHistoryBtn').onclick = function() {
        if (confirm('确定要清空所有历史记录吗？')) {
            history = [];
            saveLocalLists();
            renderHistory();
        }
    };
}

// 初始化
async function main() {
    // 清除旧数据缓存
    localStorage.removeItem('aml_dict_data_version');
    
    loadSettings();
    loadLocalLists();
    await loadAllData();
    renderCategoryList();
    renderLetterNav();
    renderBookmarks();
    renderHistory();
    switchView('welcome');
    bindEvents();
    initResizer();

    // 设置新数据版本标记
    localStorage.setItem('aml_dict_data_version', '1.0');
}

// 初始化拖动分隔条
function initResizer() {
    // 左侧边栏分隔条
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const sidebar = document.querySelector('.sidebar');
    let x = 0;
    let sidebarWidth = 0;

    const sidebarMouseDownHandler = function(e) {
        x = e.clientX;
        sidebarWidth = sidebar.getBoundingClientRect().width;

        document.addEventListener('mousemove', sidebarMouseMoveHandler);
        document.addEventListener('mouseup', sidebarMouseUpHandler);
    };

    const sidebarMouseMoveHandler = function(e) {
        const dx = e.clientX - x;
        const newWidth = sidebarWidth + dx;
        
        // 限制最小和最大宽度
        if (newWidth >= 150 && newWidth <= 400) {
            sidebar.style.width = `${newWidth}px`;
        }
    };

    const sidebarMouseUpHandler = function() {
        document.removeEventListener('mousemove', sidebarMouseMoveHandler);
        document.removeEventListener('mouseup', sidebarMouseUpHandler);
    };

    sidebarResizer.addEventListener('mousedown', sidebarMouseDownHandler);

    // 右侧边栏分隔条
    const sidepanelResizer = document.getElementById('sidepanel-resizer');
    const sidepanel = document.querySelector('.sidepanel');
    let sidepanelX = 0;
    let sidepanelWidth = 0;

    const sidepanelMouseDownHandler = function(e) {
        sidepanelX = e.clientX;
        sidepanelWidth = sidepanel.getBoundingClientRect().width;

        document.addEventListener('mousemove', sidepanelMouseMoveHandler);
        document.addEventListener('mouseup', sidepanelMouseUpHandler);
    };

    const sidepanelMouseMoveHandler = function(e) {
        const dx = sidepanelX - e.clientX; // 注意这里是减号，因为是从右向左拖动
        const newWidth = sidepanelWidth + dx;
        
        // 限制最小和最大宽度
        if (newWidth >= 150 && newWidth <= 400) {
            sidepanel.style.width = `${newWidth}px`;
        }
    };

    const sidepanelMouseUpHandler = function() {
        document.removeEventListener('mousemove', sidepanelMouseMoveHandler);
        document.removeEventListener('mouseup', sidepanelMouseUpHandler);
    };

    sidepanelResizer.addEventListener('mousedown', sidepanelMouseDownHandler);

    // 书签和历史记录分隔条
    const bookmarksResizer = document.getElementById('bookmarks-resizer');
    const bookmarksPanel = document.querySelector('.panel-block:first-child');
    const historyPanel = document.querySelector('.panel-block:last-child');
    let y = 0;
    let bookmarksHeight = 0;

    const bookmarksMouseDownHandler = function(e) {
        y = e.clientY;
        bookmarksHeight = bookmarksPanel.getBoundingClientRect().height;

        document.addEventListener('mousemove', bookmarksMouseMoveHandler);
        document.addEventListener('mouseup', bookmarksMouseUpHandler);
    };

    const bookmarksMouseMoveHandler = function(e) {
        const dy = e.clientY - y;
        const newHeight = bookmarksHeight + dy;
        const containerHeight = bookmarksPanel.parentElement.getBoundingClientRect().height;
        
        // 限制最小和最大高度
        if (newHeight >= 100 && newHeight <= containerHeight - 100) {
            bookmarksPanel.style.height = `${newHeight}px`;
            historyPanel.style.height = `${containerHeight - newHeight - 5}px`; // 5px 是分隔条的宽度
        }
    };

    const bookmarksMouseUpHandler = function() {
        document.removeEventListener('mousemove', bookmarksMouseMoveHandler);
        document.removeEventListener('mouseup', bookmarksMouseUpHandler);
    };

    bookmarksResizer.addEventListener('mousedown', bookmarksMouseDownHandler);
}

main();
