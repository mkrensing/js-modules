import $ from 'jquery';

export function getTemplates(contextPath, templates) {

    let progress=0;
    return new Promise(function(resolve, reject) {

        if(templates.length == 0) {
            resolve();
        }

        templates.forEach(template => {

            $('head').append("<script id='" + template.id + "' type='x-tmpl-mustache' ></script>");

            var templatePath = contextPath + "/" + template.path;
            $('#' + template.id).load(templatePath, function(responseText, textStatus, req) {
                if (textStatus == "error") {
                    console.error("Failed loading template", template, req);
                    reject({ statusCode: req.status, message: "Failed loading template: " + template.id, detail: template.path });
                    return;
                }

                if (++progress == templates.length) {
                    resolve();
                }
            });
        });
    });
}