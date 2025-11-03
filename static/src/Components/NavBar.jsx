const NavBar = () => {
  return (
    <nav className="flex justify-between">
        <img className="w-26 h-10" src="logo.png" alt="logo" />
        {/* Language Dropdown */}
        <div className="flex gap-2">
           <div className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-xl border-b-4 hover:bg-gray-200">
                <img className="w-5 h-5" src="flag.png" alt="" />
                 <select name="" id="" className="cursor-pointer hidden sm:block">
                    <option value="ENG" className="hidden">ENG</option>
                 </select>
                 <img className="block sm:hidden" src="arrow.png" alt="arrow" />
           </div>
           {/* Contact Us Button */}
            <div className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-xl border-b-4 hover:bg-gray-200">
                <img className="w-5 h-5" src="sms.png" alt="sms_img" />
                <button className="cursor-pointer hidden sm:block">CONTACT US</button>
            </div>
        </div>
    </nav>
  )
}

export default NavBar
