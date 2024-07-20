var ProfileCardComponent = {
    view: vnode => {
        return m(".user-info", [
            m("img.mg-profile.img-circle.img-responsive.center-block", {
                src: vnode.attrs.image
            }),
            m("ul.meta.list.list-unstyled", [
                m("li.name", `@${vnode.attrs.username}`),
                m("li.email.small", `${vnode.attrs.email}`),
                m("li.activity.small", `Acesso em: ${vnode.attrs.last_login}`),
            ])
        ])
    }
}

var VerticalMenuComponent = {
    view: vnode => {
        return m("nav.side-menu",
            m("ul.nav", [
                m("li",
                    m("a", {
                        href: "#"
                    }, m("span.fa.fa-user", " Perfil"))
                ),
                m("li.active", 
                    m("a", {
                        href: "#"
                    }, m("span.fa.fa-th", " Meu Drive"))
                )
            ])
        )
    }
}

var WellcomeComponent = {
    view: vnode => {
        return m(".content-header-wrapper", [
            m("h2.title", `Seja bem vindo(a) ${vnode.attrs.name}`),
            m(".actions", m("button.btn.btn-success", [
                m("i.fa.fa-plus"),
                vnode.attrs.folder_id ? " Carregar novo item" : " Criar nova pasta"
            ]))
        ])
    }
}

var Tablecomponent = {
    storage: [
        {
            id: 1,
            type: "folder",
            name: "Meus Documentos",
            create_date: "Jul 19, 2024",
            url: null,
            size: "--",
        },
        {
            id: 1,
            type: "attachment",
            name: "Meeting Notes.txt",
            create_date: "Sep 20, 2015",
            url: "#",
            size: "171 MB",
        }
    ],

    view: vnode => {
        return m("table.table", [
            m("thead",
                m("tr", [
                    m("th.type", ""),
                    m("th.name.truncate", "Nome"),
                    m("th.date", "Enviado"),
                    m("th.download", ""),
                    m("th.size", "Tamanho")
                ])
            ),
            m("tbody", (Tablecomponent.storage||[]).map(item => {
                return m("tr", [
                    m("td.type", m("i" + FileComponent.get_icon(item))),
                    m("td.name.truncate", item.name),
                    m("td.date", item.create_date),
                    m("td.download", FileComponent.get_url(item)),
                    m("td.size", item.size),
                ])
            }))
        ])
    },
}

var FileComponent = {
    get_icon: (item) => {
        let arr_name = item.name.split(".")
        let ext = arr_name[arr_name.length -1]
        return {
            "txt": ".fa.fa-file-text-o",
            "jpg": ".fa.fa-file-image-o",
            "ptt": ".fa.fa-file-powerpoint-o",
            "csv": ".fa.fa-file-excel-o",
            "pdf": ".fa.fa-file-pdf-o",
            "doc": ".fa.fa-file-word-o",
            "html": ".fa.fa-file-code-o",
        }[(ext||"").toLocaleLowerCase()] || ".fa.fa-folder"
    },
    get_url: (item) => {
        if (item.type == "folder")
            return ""
        return m("a", {
            href: item.url,
            target: "_blanck"
        }, m("i.fa.fa-download"))
    }
}
