const Footer = () => {
    return (
        <footer>
            <div className="flex md:flex-row flex-col items-center justify-center gap-20 mt-24">
                <div className="flex gap-20">
                    <ul>
                        <li className="font-bold mb-3">About</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">About</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Contact Us</li>
                    </ul>
                    <ul>
                        <li className="font-bold mb-3">Apps</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Appstore</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Playstore</li>
                    </ul>
                </div>
                <div className="flex gap-10 md:gap-20">
                    <ul>
                        <li className="font-bold mb-3">Legal</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Terms of Service</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Privacy Policy</li>
                    </ul>
                    <ul>
                        <li className="font-bold mb-3">Social</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Instagram</li>
                        <li className="text-gray-500 underline font-semibold cursor-pointer">Youtube</li>
                    </ul>
                </div>
            </div>
            <p className="text-gray-500 font-semibold text-center mt-10">© 2025 Learning App. All right reserved</p>
        </footer>
    )
}

export default Footer
