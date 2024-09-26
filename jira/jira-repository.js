import $ from 'jquery';

export class JiraRepository {

    constructor(baseUrl) {
        this.baseUrl = baseUrl || "";
    }

    getIssues(jql, useCache, config) {
        return this.paginate(this.baseUrl + "/history/search", jql, useCache, 0, config || {}, [])
    }

    getSprints(projectId, nameFilter, activatedDate, forceReload = false) {
        let _this=this;
        return _this.get(_this.baseUrl + `/sprints/${projectId}/${nameFilter}/${activatedDate}?forceReload=${forceReload}`);
    }

    paginate(url, jql, useCache, startAt, config, preloadedResult) {
        let _this=this;
        return new Promise(function(resolve, reject) {
            var body = {
                ...config,
                jql: jql,
                pageSize: 200,
                useCache: useCache
            }

            _this.post(url + "/" + startAt, body).then(jiraPage => {
                preloadedResult = preloadedResult.concat(jiraPage.issues);
                if(jiraPage.hasNext) {
                    _this.paginate(url, jql, useCache, jiraPage.nextStartAt, config, preloadedResult).then(result => {
                        resolve(result);
                    }).catch(error => {
                        reject(error);
                    });
                } else {
                    resolve({ issues: preloadedResult, timestamp: jiraPage.timestamp });
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    post(url, jsonData) {

        this.initAuthorizationHeader();

        return new Promise(function(resolve, reject) {
            $.ajax(url, { data: JSON.stringify(jsonData), contentType : 'application/json', type: 'POST' }).done(result => {
                resolve(result);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject(createErrorFromResponse(jqXHR, "Failed receiving data: " + errorThrown))
            });
        });
    }

    get(url) {

        this.initAuthorizationHeader();

        return new Promise(function(resolve, reject) {
            $.get(url).done(result => {
                resolve(result);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject(createErrorFromResponse(jqXHR, "get(" + url + ") failed: " + errorThrown))
            });
        });
    }

    jiraTokenAuthenticationWithUrlParameter() {

        var token = new URL(window.location.href).searchParams.get("token");
        if(token) {
            let encodedToken = encodeURIComponent(token);
            $.get("/rest/auth/login?token=" + encodedToken, function(result) {
                window.location.href = getUrlWithoutParam("token");
            });
            return true;
        }

        return false;
    }

    initAuthorizationHeader() {
        if(! $.ajaxSettings.headers || !$.ajaxSettings.headers["Authorization"]) {
            $.ajaxSetup({
               headers:{
                  'Authorization': getCookie("auth_id")
               }
            });
        }
    }

}

function mergeArray(array) {

    if(array.length == 0) {
        return [];
    }

    let keys = Object.keys(array[0]);
    let result = {};
    keys.forEach(key => {
        result[key] = [];
    });
    array.forEach(item => {
        keys.forEach(key => {
            result[key] = result[key].concat(item[key]);
        });
    });

    return result;
}

function createErrorFromResponse(jqXHR, message) {

    var detail = "";
    try {
        detail = JSON.parse(jqXHR.responseText)["error"];
    } catch(exception) {
    }

    return { statusCode: jqXHR.status, message: message, detail: detail };
}



function getUrlWithoutParam(paramName) {
    var params = new URLSearchParams(window.location.search);
    params.delete(paramName);

    return window.location.origin+window.location.pathname+"?"+params;
}


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  } else {
    return "";
  }
}

