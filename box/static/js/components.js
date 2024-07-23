var ModalComponent = {
    view: vnode => {
        return m(".modal.fade#" + vnode.attrs.id, {
            role:"dialog"
        }, m(".modal-dialog",
            m(".modal-content", [
                m(".modal-header", 
                    m("button.close", {
                        type:"button",
                        "data-dismiss": "modal", 
                    }, "x"),
                    m("h4.modal-title", vnode.attrs.title) 
                ),
                m(".modal-body", vnode.attrs.body),
                m(".modal-footer", vnode.attrs.footer)
            ])
        ))
    },
}


function new_elem(tag, id, append) {
	let elem = document.createElement(tag||"span")
	if (id) elem.id = id
	if (append != "no")
		return document.body.appendChild(elem)
	return elem
}