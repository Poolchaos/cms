import React from 'react';

const Layout =(props: {children: IProps}) =>{
    return(
      <div id="layout--template">
        {/* <Header/> */}
        <main>{props.children}</main>
        {/* <Footer/> */}
      </div>
    )
}

export default Layout;