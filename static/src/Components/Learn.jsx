const Learn = () => {
    return (
        <section className='mt-20 px-8 sm:px-16'>
            <h4 className='text-violet-800 font-bold text-center text-3xl'>Lot to Reasons to learn with us</h4>
            <p className='text-center mt-3 text-xs'>Discover smarter, faster, and more fun ways to reach your learning goals.</p>
            {/* Feature 1 */}
            <div className='flex lg:flex-row flex-col gap-10 mt-18'>
                <div className='mx-auto lg:w-[400px] flex gap-2 flex-col justify-center'>
                    <span className="text-violet-800 font-semibold">Feature</span>
                    <h6 className='font-bold text-3xl'>Tiny Lessons, Big Brain Energy</h6>
                    <p>We turned complicated topics into bite-sized, "oh-wow-that's-how-it-works" moments. Each lesson is short enough to fit between texts from your group chat -- anf fun enough to actually finish.</p>
                    <p>Warning: May cause sudden bursts of "wait, I get this now!"</p>
                </div>
                <div className='mx-auto lg:w-[480px] lg:min-w-[460px]'>
                    <img src="learn_img_1.png" alt="img_1" />
                </div>
            </div>
            {/* Feature 2 */}
            <div className='flex lg:flex-row flex-col gap-10 mt-18'>
                <div className='mx-auto lg:w-[480px] lg:min-w-[460px]'>
                    <img src="learn_img_2.png" alt="img_1" />
                </div>
                <div className='mx-auto lg:w-[400px] flex gap-2 flex-col justify-center'>
                    <span className="text-violet-800 font-semibold">Feature</span>
                    <h6 className='font-bold text-3xl'>Learning, But Make it a Game</h6>
                    <p>Points, Streaks, Challenges, Rewards. Basically, it's like your favorite game -- except instead of shooting zombies, you're shooting for personal growth.</p>
                    <p>Stay on a streak longer than your gym routine. (We believe in you.)</p>
                </div>
            </div>
            {/* Feature 3 */}
            <div className='flex lg:flex-row flex-col gap-10 mt-18'>
                <div className='mx-auto lg:w-[400px] flex gap-2 flex-col justify-center'>
                    <span className="text-violet-800 font-semibold">Feature</span>
                    <h6 className='font-bold text-3xl'>Friends, Feats & Flexes</h6>
                    <p>Because Self-improvement is more fun with witnesses. Why learn alone when you can squad up? invite your friends, form study crews, or just flex your leaderboard position like it's your Spotify Wrapped.</p>
                </div>
                <div className='mx-auto lg:w-[480px] lg:min-w-[460px]'>
                    <img src="learn_img_3.png" alt="img_1" />
                </div>
            </div> 
        </section>
    )
}

export default Learn
