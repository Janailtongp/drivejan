var BoxStorage = {
    token: {},
    data: {}
}

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
            m("h2.title", `UUID ${vnode.attrs.uuid}`),
            m("h2.title", `Token) ${BoxStorage.token[vnode.attrs.uuid]}`),
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

var DynamicStruct = {
    qrcode_base64: null,
    ws: {},
    get_existing_uuid: () => {
        const CURRENT_UUID = window.localStorage.getItem("CURRENT_UUID")
        if (CURRENT_UUID) {
            const UUID_EXPIRED_TIME = window.localStorage.getItem("UUID_EXPIRED_TIME")
            if (!UUID_EXPIRED_TIME) {
                window.localStorage.removeItem("CURRENT_UUID")
                return null
            }
            if(moment().isAfter(moment(UUID_EXPIRED_TIME))) {
                window.localStorage.removeItem("CURRENT_UUID")
                window.localStorage.removeItem("UUID_EXPIRED_TIME")
                BoxStorage.token[CURRENT_UUID] = null
                window.localStorage.removeItem(CURRENT_UUID)
                return null
            }
            return CURRENT_UUID
        }
        return null
    },
    get_uuid: vnode => {
        return DynamicStruct.get_existing_uuid() || vnode.attrs.ws_address.uuid
    },
    refresh_token: vnode => {
        let token = window.localStorage.getItem(DynamicStruct.get_uuid(vnode))
        if (token) {
            BoxStorage.token[DynamicStruct.get_uuid(vnode)] = token
        } else {
            BoxStorage.token[DynamicStruct.get_uuid(vnode)] = null
        }
    },
    get_token: vnode => {
        DynamicStruct.refresh_token(vnode)
        return BoxStorage.token[DynamicStruct.get_uuid(vnode)]
    },
    onupdate: vnode => {
        DynamicStruct.refresh_token(vnode)
    },
    oninit: vnode => {
        if (!vnode.attrs.ws_address) 
            throw "qrcode not found"
        console.log(DynamicStruct.get_uuid(vnode)) // Remove Before commit

        DynamicStruct.refresh_token(vnode)
        if (!DynamicStruct.get_token(vnode)) {
            // Get png qrcode image 
            m.request({
                url: `/api/box/qrcode/${DynamicStruct.get_uuid(vnode)}/`,
                method: "GET",
                headers: {
                    "Authorization": "Token "
                }   
            }).then(data => {
                DynamicStruct.qrcode_base64 = data.qrcode
            }).catch(err => {
                console.log(err)
            })
        }
        DynamicStruct.web_socket_setup(vnode)
    },
    web_socket_setup: vnode => {
        // WS channel connect
        DynamicStruct.ws[DynamicStruct.get_uuid(vnode)] = new WebSocket(
            'ws://' + window.location.host + `/ws/box/${DynamicStruct.get_uuid(vnode)}/`
        )
        // Token receive
        DynamicStruct.ws[DynamicStruct.get_uuid(vnode)].onmessage = function(e) {
            let data = JSON.parse(e.data)
            data = data["payload"];
            const event = data['event']
            if (event && event == "TOKEN") {
                window.localStorage.setItem(DynamicStruct.get_uuid(vnode), data['message'])
                window.localStorage.setItem("CURRENT_UUID", DynamicStruct.get_uuid(vnode))
                window.localStorage.setItem("UUID_EXPIRED_TIME", moment().add(1, 'minutes').format())
                setTimeout(() => {
                    DynamicStruct.refresh_token(vnode)
                    m.redraw()
                }, 100)

            }
        }
        // WS closed unexpectedly
        DynamicStruct.ws[DynamicStruct.get_uuid(vnode)].onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
            console.error(e)
        }
        DynamicStruct.ws[DynamicStruct.get_uuid(vnode)].onopen = function open() {}
    },
    view: vnode => {
        if(!DynamicStruct.get_token(vnode)) {
            if (!DynamicStruct.qrcode_base64) {
                return m("h1", "Loading ...")
            }
            return m(".view-account", 
                m(".module", 
                    m(".module-inner.qrcode", [
                        m(".h3", "Leia o qrcode no app autenticador"),
                        m("img", {
                            src:`data:image/png;base64, ${DynamicStruct.qrcode_base64}`
                        })
                    ])
                )
            )
        }
        return m(".view-account", 
            m("section.module", 
                m(".module-inner", [
                    m(".side-bar", [
                        m("#profile-card", m(ProfileCardComponent, {
                            uuid: DynamicStruct.get_uuid(vnode)
                        })),
                        m("#vertical-menu", m(VerticalMenuComponent, {
                            uuid: DynamicStruct.get_uuid(vnode)
                        }))
                    ]),
                    m(".content-panel", [
                        m("#wellcome", m(WellcomeComponent, {
                            uuid: DynamicStruct.get_uuid(vnode)
                        })),
                        m(".drive-wrapper.drive-list-view", 
                            m("span.files-list", m(Tablecomponent, {
                                uuid: DynamicStruct.get_uuid(vnode)
                            }))
                        )
                    ])
                ])
            )
        )
    }
}