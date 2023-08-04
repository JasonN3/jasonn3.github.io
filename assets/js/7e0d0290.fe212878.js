"use strict";(self.webpackChunkblogs=self.webpackChunkblogs||[]).push([[646],{4137:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=r.createContext({}),p=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=p(e.components);return r.createElement(s.Provider,{value:t},e.children)},d="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},h=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=p(n),h=i,m=d["".concat(s,".").concat(h)]||d[h]||c[h]||o;return n?r.createElement(m,a(a({ref:t},u),{},{components:n})):r.createElement(m,a({ref:t},u))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=h;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[d]="string"==typeof e?e:i,a[1]=l;for(var p=2;p<o;p++)a[p]=n[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}h.displayName="MDXCreateElement"},8218:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>a,default:()=>c,frontMatter:()=>o,metadata:()=>l,toc:()=>p});var r=n(7462),i=(n(7294),n(4137));const o={sidebar_label:"Provisioning",sidebar_position:4},a="Machine Provisioning",l={unversionedId:"RH/satellite/provisioning",id:"RH/satellite/provisioning",title:"Machine Provisioning",description:"There a few choices to get everything started, but the processes have fairly similar dependencies",source:"@site/docs/RH/satellite/provisioning.md",sourceDirName:"RH/satellite",slug:"/RH/satellite/provisioning",permalink:"/RH/satellite/provisioning",draft:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_label:"Provisioning",sidebar_position:4},sidebar:"tutorialSidebar",previous:{title:"Git Repo",permalink:"/RH/satellite/puppet/git-repo"},next:{title:"Kickstart in Azure",permalink:"/RH/satellite/kickstart-in-Azure"}},s={},p=[{value:"Configuring PXE with DHCP Options",id:"configuring-pxe-with-dhcp-options",level:2},{value:"Download the boot disk for PXE without DHCP Options",id:"download-the-boot-disk-for-pxe-without-dhcp-options",level:2},{value:"Deploying a host",id:"deploying-a-host",level:2}],u={toc:p},d="wrapper";function c(e){let{components:t,...n}=e;return(0,i.kt)(d,(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"machine-provisioning"},"Machine Provisioning"),(0,i.kt)("p",null,"There a few choices to get everything started, but the processes have fairly similar dependencies"),(0,i.kt)("h2",{id:"configuring-pxe-with-dhcp-options"},"Configuring PXE with DHCP Options"),(0,i.kt)("p",null,"Configure your DHCP server with the following options. Option 67 should return different values depending on the ",(0,i.kt)("inlineCode",{parentName:"p"},"user-class"),". Most DHCP servers can handle conditional return values."),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:null},"Option Name"),(0,i.kt)("th",{parentName:"tr",align:null},"Option Number"),(0,i.kt)("th",{parentName:"tr",align:null},"Description"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:null},"next-server"),(0,i.kt)("td",{parentName:"tr",align:null},"66"),(0,i.kt)("td",{parentName:"tr",align:null},"Set to the TFTP server that hosts iPXE's boot file. This can be the Satellite server or another server")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:null},"filename"),(0,i.kt)("td",{parentName:"tr",align:null},"67"),(0,i.kt)("td",{parentName:"tr",align:null},"- Initially set to the boot file on the TFTP server. Satellite uses ",(0,i.kt)("inlineCode",{parentName:"td"},"pxelinux.0")," ",(0,i.kt)("br",null)," - When ",(0,i.kt)("inlineCode",{parentName:"td"},'user-class = "iPXE"'),", it should return the iPXE script. By default this is ",(0,i.kt)("inlineCode",{parentName:"td"},"http://<satellite_server>:8000/unattended/iPXE"))))),(0,i.kt)("h2",{id:"download-the-boot-disk-for-pxe-without-dhcp-options"},"Download the boot disk for PXE without DHCP Options"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"Log in to the web interface of the Satellite server"),(0,i.kt)("li",{parentName:"ol"},"Browse to ",(0,i.kt)("inlineCode",{parentName:"li"},"Infrastructure")," -> ",(0,i.kt)("inlineCode",{parentName:"li"},"Subnets")),(0,i.kt)("li",{parentName:"ol"},"On the row for one of your subnets, click the arrow down ",(0,i.kt)("strong",{parentName:"li"},"next to")," ",(0,i.kt)("inlineCode",{parentName:"li"},"Delete")," and select ",(0,i.kt)("inlineCode",{parentName:"li"},"Subnet generic image"),(0,i.kt)("br",{parentName:"li"}),"The ",(0,i.kt)("inlineCode",{parentName:"li"},"Subnet generic image")," will contain iPXE with a script to override the DHCP options required for PXE booting.",(0,i.kt)("br",{parentName:"li"}),"The only subnet specific information stored in the image is the ",(0,i.kt)("inlineCode",{parentName:"li"},"Template Capsule")," as that is used when downloading the template files. As long as you are using the same ",(0,i.kt)("inlineCode",{parentName:"li"},"Template Capsule"),", you can use the image on multiple subnets")),(0,i.kt)("h2",{id:"deploying-a-host"},"Deploying a host"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"Log in to the web interface of your Satellite server"),(0,i.kt)("li",{parentName:"ol"},"Browse to ",(0,i.kt)("inlineCode",{parentName:"li"},"Hosts")," -> ",(0,i.kt)("inlineCode",{parentName:"li"},"Create Host")," on the menu"),(0,i.kt)("li",{parentName:"ol"},"Enter the machine name and fill out any information that is needed about the machine"),(0,i.kt)("li",{parentName:"ol"},"Boot the machine from PXE or from the boot disk you downloaded")))}c.isMDXComponent=!0}}]);