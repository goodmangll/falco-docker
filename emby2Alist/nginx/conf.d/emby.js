//author: @bpking  https://github.com/bpking1/embyExternalUrl
//查看日志: "docker logs -f -n 10 embyAlistNginx 2>&1  | grep js:"


/** 直连管理器地址 */
const directUrlManagerAddress = "http://172.17.0.1:13000";



/**
 * 通过直连管理器获取直连地址
 * 
 * @param {*} r nginx请求
 * @returns 返回
 */
async function redirect2Pan(r) {

    const res = await getDirectUrl(r);
    if (!res.startsWith("error")) {
        r.warn(`redirect to: ${res}`);
        r.return(302, res);
        return;
    }
    if (res.startsWith("error403")) {
        r.error(res);
        r.return(403, res);
        return;
    }
    if (res.startsWith("error500")) {
        const filePath = alistFilePath.substring(alistFilePath.indexOf("/", 1));
        const foldersRes = await getDirectUrl(r);
        if (foldersRes.startsWith("error")) {
            r.error(foldersRes);
            r.return(500, foldersRes);
            return;
        }
        const folders = foldersRes.split(",").sort();
        for (let i = 0; i < folders.length; i++) {
            r.warn(`try to fetch alist path from /${folders[i]}${filePath}`);
            let driverRes = await getDirectUrl(r);
            if (!driverRes.startsWith("error")) {
                r.warn(`redirect to: ${driverRes}`);
                r.return(302, driverRes);
                return;
            }
        }
        r.error(res);
        r.return(404, res);
        return;
    }
    r.error(res);
    r.return(500, res);
    return;
}


/**
 * 
 * 用户播放前需要调用的参数
 * 
 * @param {*} r nginx参数
 */
async function userPlay(r) {
    // 播放前通知
    r.error(`播放前通知，播放预知`)
    let res = await ngx.fetch(`${directUrlManagerAddress}/api/userPlay`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(r)
    })
    // r.internalRedirect(`${embyHost}${r.uri}`);
    r.internalRedirect('@backend');
}

async function getDirectUrl(r) {
    try {
        const response = await ngx.fetch(`${directUrlManagerAddress}/api/getDirectUrl`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            max_response_body_size: 65535,
            body: JSON.stringify(r),
        });
        if (response.ok) {
            const result = await response.json();

            if (result === null || result === undefined) {
                return `error: alist_path_api response is null`;
            }

            if (result.message == "success") {
                if (result.data.raw_url) {
                    return result.data.raw_url;
                }
                return result.data.content.map((item) => item.name).join(",");
            }

            if (result.code == 403) {
                return `error403: alist_path_api ${result.message}`;
            }
            return `error500: alist_path_api ${result.code} ${result.message}`;
        } else {
            return `error: alist_path_api ${response.status} ${response.statusText}`;
        }
    } catch (error) {
        return `error: alist_path_api fetchAlistFiled ${error}`;
    }
}

export default { redirect2Pan, userPlay };

