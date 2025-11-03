import './App.css'
import Footer from './Components/Footer'
import Learn from './Components/Learn'
import NavBar from './Components/NavBar'

function App() {
  return (
      <div className='px-2 sm:px-8 py-4'>
        <NavBar/>
        <section className='flex flex-col gap-2 mt-5 rounded-xl justify-center pr-[25%] sm:pr-[40%] md:pr-[65%] pl-[5%] h-[80vh] bg-[url(background_image_cutted.png)] md:bg-[url(background_image.png)] bg-cover bg-bottom md:bg-bottom-right '>
            <p className='font-bold text-3xl'>Learning That Doesn't Feel Like Homework</p>
            <p className='md:font-semibold'>Stop doomscrolling. Start brainscollling.</p>
            <p className='text-xs hidden md:block'>Learn something brilliant between memes, coffee , or procrastination sessions. Because smart looks good on you.</p>
            <button className='text-white px-10 py-2 border border-violet-700 hover:border-[#710cc4] rounded-xl border-b-4 w-[220px] bg-[#9515fe] mt-4 font-bold cursor-pointer hover:bg-[#710cc4]'>GET STARTED</button>
        </section>
        <Learn/>
        <section className='flex flex-col gap-2 mt-36 md:mt-14 rounded-xl justify-center text-center md:text-start md:pr-[65%] pl-[5%] h-[65vh] bg-[url(background_image_3.png)] md:bg-[url(background_image_2.png)] bg-no-repeat bg-center md:bg-cover md:bg-bottom relative'>
            <p className='font-bold text-3xl text-violet-800 relative bottom-46 md:bottom-0'>Ready to Out-Smart your past Self?</p>
            <p className='relative bottom-46 md:bottom-0'>Learn smarter, Laugh harder. Forget less.</p>
            <button className='mx-auto md:m-1 text-white px-8 py-2 border border-black rounded-xl border-b-4 w-[200px] bg-[#9515fe] hover:bg-[#710cc4] mt-4 font-bold relative bottom-46 md:bottom-0 cursor-pointer'>GET STARTED</button>
        </section>
        <Footer/>
      </div>
  )
}

export default App
