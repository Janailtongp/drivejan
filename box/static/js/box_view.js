var BoxStorage = {
    token: {},
    data: {},
    user: {},
}

var ProfileCardComponent = {
    view: vnode => {
        if (!BoxStorage.user[vnode.attrs.uuid])
            return ""
        let user = BoxStorage.user[vnode.attrs.uuid]
        return m(".user-info", [
            m("img.mg-profile.img-circle.img-responsive.center-block", {
                src: user.gravatar_url
            }),
            m("ul.meta.list.list-unstyled", [
                m("li.name", `@${user.username}`),
                m("li.email.small", `${user.email}`),
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
    oninit: vnode => {
        m.request({
            url: `/api/box/users/`,
            method: "GET",
            headers: {
                "Authorization": "Token " + BoxStorage.token[vnode.attrs.uuid]
            }   
        }).then(data => {
            BoxStorage.user[vnode.attrs.uuid] = data[0]
        }).catch(err => {
            console.log(err)
        })
    },
    view: vnode => {
        if (!BoxStorage.user[vnode.attrs.uuid])
                return ""
        let user = BoxStorage.user[vnode.attrs.uuid]
        return m(".content-header-wrapper", [
            m("h2.title", `Seja bem vindo(a) ${user.name}`),
            m(".actions", [
                (
                    Tablecomponent.folder_id ? m("button.btn.btn-success", [
                        m("i.fa.fa-plus"), " Add arquivo"
                    ]) : ""
                ),
                m("button.btn.btn-info", [
                    m("i.fa.fa-plus"), " Criar nova pasta"
                ])
            ])
        ])
    }
}

var Tablecomponent = {
    folder_id: null,
    oninit: vnode => {
        Tablecomponent.get_folder(vnode)
    },
    get_folder: (vnode) => {
        let url = "/api/box/folders/"
        if (Tablecomponent.folder_id) {
            url = `/api/box/folders/${Tablecomponent.folder_id}/`
        }
        m.request({
            url: url,
            method: "GET",
            headers: {
                "Authorization": "Token " + BoxStorage.token[vnode.attrs.uuid]
            }   
        }).then(data => {
            BoxStorage.data[vnode.attrs.uuid] = Tablecomponent.folder_id ? [data] : data
        }).catch(err => {
            console.log(err)
        })
    },
    get_current_path: vnode => {
        let home = m("a", {
            href: "javascript:void(0);",
            onclick: evt => {
                Tablecomponent.folder_id = null
                Tablecomponent.get_folder(vnode)
                m.redraw()
            }
        }, m("i.fa.fa-home"))

        if (!Tablecomponent.folder_id)
            return [m("li", home)]
        return [
            m("li", home),
            (BoxStorage.data[vnode.attrs.uuid]||[]).map(folder => {
                return (folder.full_path||[]).map(parent => {
                    return [
                        m("li", "/"),
                        m("li", 
                        (
                            Tablecomponent.folder_id == parent.pk ? m("li", m("u", parent.name)) : m("a", {
                                href: "javascript:void(0);",
                                    onclick: evt => {
                                        Tablecomponent.folder_id = parent.pk
                                        Tablecomponent.get_folder(vnode)
                                        m.redraw()
                                    }
                                }, parent.name)
                            )
                        )
                    ]
                })
            })
        ]
    },
    get_folder_items: (vnode) => {
        if (Tablecomponent.folder_id) {
            return BoxStorage.data[vnode.attrs.uuid].map(folder => folder.get_items)[0]
        }
        return BoxStorage.data[vnode.attrs.uuid].map(folder => {
            return {
                "type": "folder",
                "pk": folder.pk,
                "name": folder.name,
                "created_at": folder.created_at,
            }
        })
    },
    view: vnode => {
        if (!BoxStorage.data[vnode.attrs.uuid])
            return ""
        let items = Tablecomponent.get_folder_items(vnode)
        return [
            m("ul.list-inline", [
                m("li", "Você está em: "),
                ...Tablecomponent.get_current_path(vnode),
            ]),
            m("table.table", [
                m("thead",
                    m("tr", [
                        m("th", ""),
                        m("th", "Nome"),
                        m("th", "Enviado"),
                        m("th", "Tamanho"),
                        m("th", ""),
                    ])
                ),
                m("tbody", items.map(item => {
                    return m("tr", [
                        m("td", FileComponent.get_icon(item)),
                        m("td", {title: item.name}, Tablecomponent.get_linked_name(vnode, item)),
                        m("td", item.created_at),
                        m("td", item.size),
                        m("td", FileComponent.get_url(item)),
                    ])
                }))
            ]),
            items.length < 1 ?  m(".qrcode", {rowspan:"2"}, m("h3", "Pasta vazia")) : ""
        ]
    },
    get_linked_name: (vnode, item) => {
        let name = item.short_name ? item.short_name: item.name
        if (item.type == "folder") {
            return m("a", {
                href: "javascript:void(0);",
                target: "",
                onclick: evt => {
                    Tablecomponent.folder_id = item.pk
                    Tablecomponent.get_folder(vnode)
                    m.redraw()
                }
            }, name)
        }
        return m("a", {href: item.url, target: "blank_"}, name)
    }
}

var FileComponent = {
    get_icon: (item) => {
        if (item.type == "folder")
            return m("i.fa.fa-folder")

        let arr_name = (item.url||"").split(".")
        let ext = arr_name[arr_name.length -1]
        let icon = {
            "txt": ".fa.fa-file-text-o",
            "jpg": ".fa.fa-file-image-o",
            "ptt": ".fa.fa-file-powerpoint-o",
            "csv": ".fa.fa-file-excel-o",
            "pdf": ".fa.fa-file-pdf-o",
            "doc": ".fa.fa-file-word-o",
            "html": ".fa.fa-file-code-o",
        }[(ext||"").toLocaleLowerCase()] || ".fa.fa-folder"

        return m("i"+ icon, {title: "." + (ext||"").toLocaleLowerCase()})
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