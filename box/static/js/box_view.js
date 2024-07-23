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
                    Tablecomponent.folder_id ? m("button.btn.btn-success.mr-1", {
                        onclick: evt => {
                            FileModalComponent.show(vnode.attrs.uuid)
                        }
                    },[
                        m("i.fa.fa-plus"), " Adicionar arquivo"
                    ]) : ""
                ),
                m("button.btn.btn-info.mr-1", {
                    onclick: evt => {
                        FolderModalComponent.show(uuid=vnode.attrs.uuid)
                    }
                }, [
                    m("i.fa.fa-plus"), " Criar nova pasta"
                ]),
                m("button.btn.btn-danger.ml-1", {
                    onclick: evt => {
                        const CURRENT_UUID = window.localStorage.getItem("CURRENT_UUID")
                        if (CURRENT_UUID) {
                            BoxStorage.token[CURRENT_UUID] = null
                            window.localStorage.removeItem(CURRENT_UUID)
                        }
                        window.localStorage.removeItem("CURRENT_UUID")
                        window.localStorage.removeItem("UUID_EXPIRED_TIME")
                        Tablecomponent.get_folder(vnode, vnode.attrs.uuid)
                    }
                }, [
                    m("i.fa.fa-power-off"), " Sair"
                ])
            ])
        ])
    }
}

var FolderModalComponent = {
    id: "folder-modal-component",
    ADD: 1,
    EDIT: 2,
    mode: null,
    data: {},
    view: vnode => {
        return m(ModalComponent, {
            id: FolderModalComponent.id,
            title: "Add/Edit Pasta",
            body: FolderModalComponent.body(vnode),
            footer: FolderModalComponent.footer(vnode),
        })
    },
    body: vnode => {
        if (FolderModalComponent.mode == FolderModalComponent.EDIT) {
            if (!FolderModalComponent.data) {
                return "Carregando ..."
            }
        }
        return m("form", [
            m(".orm-group", [
                m("label", {for:"folder_name"}, "Nome da pasta"),
                m("input.form-control#folder_name", {
                    type: "text",
                    placeholder: "Meus documentos",
                    value: FolderModalComponent.data.name||"",
                    onchange: evt => {
                        FolderModalComponent.data.name = evt.target.value
                    }
                }, "Nome da pasta"),
            ])
        ])
    },
    footer: vnode => {
        return [
            m("button.btn btn-success", {
                onclick: evt => {
                    if (FolderModalComponent.data.name) {
                        FolderModalComponent.save(vnode)
                    }
                }
            }, "Salvar"),
            m("button.btn btn-danger", {
                onclick: evt => {
                    FolderModalComponent.hide()
                }
            }, "Cancelar")
        ]
    },
    hide: () => {
        FolderModalComponent.mode = null
        FolderModalComponent.uuid = null
        FolderModalComponent.folder_id = null
        FolderModalComponent.parent = null
        FolderModalComponent.data = {}
        
		$('#' + FolderModalComponent.id).modal('hide')
	},
	show: (uuid, folder_id=null) => {
        FolderModalComponent.uuid = uuid
        FolderModalComponent.mode = FolderModalComponent.ADD
        if (folder_id) {
            FolderModalComponent.mode = FolderModalComponent.EDIT
            FolderModalComponent.folder_id = folder_id
            FolderModalComponent.load_data(FolderModalComponent.uuid, FolderModalComponent.folder_id)
        }

		if (!FolderModalComponent.initiated) {
			m.mount(new_elem('span'), FolderModalComponent)
			FolderModalComponent.initiated = true
		}
		$('#' + FolderModalComponent.id).modal({
			backdrop: 'static', keyboard: false
		})
	},
    load_data: (uuid, folder_id) => {
        m.request({
            url: `/api/box/folders/${folder_id}/`,
            method: "GET",
            headers: {
                "Authorization": "Token " + BoxStorage.token[uuid]
            }   
        }).then(data => {
            FolderModalComponent.data = data
        }).catch(err => {
            console.log(err)
        })
    },
    save: (vnode) => {
        let method = "POST"
        let url = "/api/box/folders/"
        let data = FolderModalComponent.data
        data["owner_id"] = (BoxStorage.user[FolderModalComponent.uuid]||{}).pk
        data["parent_id"] = Tablecomponent.folder_id||null

        if (FolderModalComponent.mode == FolderModalComponent.EDIT) {
            method = "PATCH"
            url = url + FolderModalComponent.folder_id + "/"
            data = {name: FolderModalComponent.data.name}
        }

        m.request({
            url: url,
            method: method,
            headers: {
                "Authorization": "Token " + BoxStorage.token[FolderModalComponent.uuid]
            },
            body: data
        }).then(data => {
            toastr.success("Operação bem-sucedida!")
            Tablecomponent.get_folder(vnode, FolderModalComponent.uuid)
            FolderModalComponent.hide()
        }).catch(err => {
            console.log(err)
        })
    }
}

var FileModalComponent = { 
    // FIXME: add DraggDrop file to upload
    id: "file-modal-component",
    data: {},
    view: vnode => {
        return m(ModalComponent, {
            id: FileModalComponent.id,
            title: "Adicionar aqruivo",
            body: FileModalComponent.body(vnode),
            footer: FileModalComponent.footer(vnode),
        })
    },
    body: vnode => {
        return m("form", [
            m(".form-group", [
                m("label", {for:"file-data"}, "Importar arquivo"),
                m("input#ile-data", {
                    type: "file",
                    onchange: evt => {
                        FileModalComponent.data.file = evt.target.files[0]
                    }

                })
            ])
        ])
    },
    footer: vnode => {
        return [
            m("button.btn btn-success", {
                onclick: evt => {
                    if (FileModalComponent.data.file) {
                        FileModalComponent.save(vnode)
                    }
                }
            }, "Salvar"),
            m("button.btn btn-danger", {
                onclick: evt => {
                    FileModalComponent.hide()
                }
            }, "Cancelar")
        ]
    },
    hide: () => {
        FileModalComponent.data = {}
		$('#' + FileModalComponent.id).modal('hide')
	},
	show: (uuid) => {
        FileModalComponent.uuid = uuid
		if (!FileModalComponent.initiated) {
			m.mount(new_elem('span'), FileModalComponent)
			FileModalComponent.initiated = true
		}
		$('#' + FileModalComponent.id).modal({
			backdrop: 'static', keyboard: false
		})
	},
    save: (vnode) => {
        let form_data = new FormData()
        form_data.append("file", FileModalComponent.data.file)
        form_data.append("folder_id", Tablecomponent.folder_id)

        m.request({
            url: "/api/box/attachments/",
            method: "POST",
            headers: {
                "Authorization": "Token " + BoxStorage.token[FileModalComponent.uuid]
            },
            body: form_data
        }).then(data => {
            toastr.success("Operação bem-sucedida!")
            Tablecomponent.get_folder(vnode, FileModalComponent.uuid)
            FileModalComponent.hide()
        }).catch(err => {
            console.log(err)
        })
    }
}

var Tablecomponent = {
    folder_id: null,
    oninit: vnode => {
        Tablecomponent.get_folder(vnode)
    },
    get_folder: (vnode, uuid=null) => {
        let url = "/api/box/folders/"
        if (Tablecomponent.folder_id) {
            url = `/api/box/folders/${Tablecomponent.folder_id}/`
        }
        m.request({
            url: url,
            method: "GET",
            headers: {
                "Authorization": "Token " + BoxStorage.token[uuid||vnode.attrs.uuid]
            }   
        }).then(data => {
            BoxStorage.data[uuid||vnode.attrs.uuid] = Tablecomponent.folder_id ? [data] : data
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
                "get_amount": folder.get_amount,
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
                        m("th", ""),
                        m("th", ""),
                    ])
                ),
                m("tbody", items.map(item => {
                    return m("tr", [
                        m("td", FileComponent.get_icon(item)),
                        m("td", {title: item.name}, Tablecomponent.get_linked_name(vnode, item)),
                        m("td", item.created_at),
                        m("td", item.get_size||item.get_amount),
                        m("td", Tablecomponent.actions(vnode, item)),
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
        return m("a", {href: "javascript:void(0);", target: ""}, name)
    },
    actions: (vnode, item) => {
        if(item.type == "folder") {
            return [
                // Edit Folder
                m("a.mr-1", {
                    href: "javascript:void(0);",
                    onclick: evt => {
                        FolderModalComponent.show(vnode.attrs.uuid, item.pk)
                    },
                    title:"Editar pasta"
                }, m("i.fa.fa-pencil")),
                // Delete Folder
                m("a", {
                    href: "javascript:void(0);",
                    onclick: evt => {
                        m.request({
                            url: `/api/box/folders/${item.pk}/`,
                            method: "DELETE",
                            headers: {
                                "Authorization": "Token " + BoxStorage.token[vnode.attrs.uuid]
                            }   
                        }).then(data => {
                            toastr.success("Operação bem-sucedida!")
                            Tablecomponent.get_folder(vnode, vnode.attrs.uuid)
                            FolderModalComponent.hide()
                        }).catch(err => {
                            console.log(err)
                        })
                    },
                    title:"Excluir pasta"
                }, m("i.fa.fa-trash")),
            ]
        } else {
            return [
                FileComponent.get_url(item),
                m("a.ml-1", {
                    href: "javascript:void(0);",
                    onclick: evt => {
                        m.request({
                            url: `/api/box/attachments/${item.pk}/`,
                            method: "DELETE",
                            headers: {
                                "Authorization": "Token " + BoxStorage.token[vnode.attrs.uuid]
                            }   
                        }).then(data => {
                            toastr.success("Operação bem-sucedida!")
                            Tablecomponent.get_folder(vnode, vnode.attrs.uuid)
                            FolderModalComponent.hide()
                        }).catch(err => {
                            console.log(err)
                        })
                    },
                    title:"Excluir Arquivo"
                }, m("i.fa.fa-trash")),
            ]
        }
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
            "png": ".fa.fa-file-image-o",
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
            target: "_blanck",
            download: "download"
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