import { PromoBar, ShopHeader, ShopTopbar } from "../components/Header";
import StorefrontChrome from "../components/StorefrontChrome";
import AboutStats from "../components/AboutStats";

export const metadata = {
  title: "About Us — Antique Home",
  description:
    "At Antique Home, we believe a home is more than a place — it's a reflection of your story, your taste, and the moments that matter most.",
};

export default function AboutPage() {
  return (
    <>
      <PromoBar />
      <ShopTopbar />
      <ShopHeader active="about" />

      <main className="about">
        <section className="about__hero">
          <div className="about__heroCopy">
            <p className="kicker kicker--gold rv" data-rv><span>Our Story</span><i className="kicker__rule" aria-hidden="true"></i></p>
            <h1 className="about__heroTitle">
              <span className="rv rv--up" data-rv>The Art of</span><br />
              <span className="rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>Living <em>Beautifully</em></span>
            </h1>
            <p className="about__heroText rv rv--up" data-rv style={{ ["--rd" as string]: ".18s" }}>
              At Antique Home, we believe a home is more than a place, it&rsquo;s a reflection of your story, your taste, and the moments that matter most.
            </p>
            <span className="ornament rv" data-rv style={{ ["--rd" as string]: ".26s" }} aria-hidden="true"><i></i><b></b><i></i></span>
          </div>
          <figure className="about__heroMedia rv rv--zoom" data-rv>
            <img src="/about/Screenshot 2026-09-26 050451.png" alt="A sunlit dining table styled with a ceramic urn, wooden bowl and books" loading="eager" />
          </figure>
        </section>

        <section className="about__journey">
          <figure className="about__journeyMedia rv rv--zoom" data-rv>
            <img src="/about/Screenshot 2026-09-26 050440.png" alt="An arched sunlit living room with a linen sofa and layered textures" loading="lazy" />
          </figure>
          <div className="about__journeyCopy">
            <p className="kicker kicker--gold rv" data-rv><span>Our Journey</span><i className="kicker__rule" aria-hidden="true"></i></p>
            <h2 className="about__journeyTitle rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>Born from a Passion<br />for Timeless Spaces</h2>
            <p className="about__journeyText rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
              Antique Home started with a simple idea — to bring unique, high-quality pieces that combine elegance, functionality, and character. We carefully curate each item to help you create a home that feels warm, authentic, and effortlessly beautiful.
            </p>
            <ul className="about__stats rv rv--up" data-rv style={{ ["--rd" as string]: ".24s" }}>
              <li><strong data-count="500" data-suffix="+">0</strong><span>Unique Pieces</span></li>
              <li className="about__statsDiv" aria-hidden="true"></li>
              <li><strong data-count="10" data-suffix="K+">0</strong><span>Happy Homes</span></li>
              <li className="about__statsDiv" aria-hidden="true"></li>
              <li><strong data-count="5" data-suffix="+">0</strong><span>Years of Trust</span></li>
            </ul>
          </div>
        </section>

        <section className="about__philosophy">
          <div className="about__philosophyCopy">
            <p className="kicker kicker--gold rv" data-rv><span>Our Philosophy</span><i className="kicker__rule" aria-hidden="true"></i></p>
            <h2 className="about__philosophyTitle rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>More Than Furniture,<br />A Way of Living</h2>
            <p className="about__philosophyText rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
              We believe in spaces that tell a story — spaces filled with texture, harmony, and meaningful details. Every piece we choose is designed to bring timeless beauty and lasting comfort into your everyday life.
            </p>
          </div>
          <figure className="about__philosophyMedia rv rv--zoom" data-rv>
            <img src="/about/Screenshot 2026-09-26 050433.png" alt="Warm afternoon light casting leaf shadows across a plaster wall" loading="lazy" />
            <blockquote className="about__quote">
              <p>&ldquo;A home should be a collection<br />of what you love.&rdquo;</p>
              <span className="about__quoteRule" aria-hidden="true"><i></i><b></b><i></i></span>
            </blockquote>
          </figure>
        </section>

        <ul className="about__features">
          <li>
            <span className="about__featureIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4c6 6 6 14 0 24-6-10-6-18 0-24Z"></path><path d="M16 12c3-2 6-2 9 0M16 20c-3-2-6-2-9 0"></path></svg></span>
            <h3>Carefully Curated</h3>
            <p>Handpicked pieces with<br />character and quality.</p>
          </li>
          <li>
            <span className="about__featureIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3 27 12l-11 17L5 12Z"></path><path d="M5 12h22M16 3v26"></path></svg></span>
            <h3>Timeless Design</h3>
            <p>Styles that never go<br />out of fashion.</p>
          </li>
          <li>
            <span className="about__featureIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 15.4 16 5.4l12 10"></path><path d="M6.4 13.4V26h19.2V13.4"></path></svg></span>
            <h3>For Every Home</h3>
            <p>Pieces that fit your<br />lifestyle and space.</p>
          </li>
          <li>
            <span className="about__featureIco" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3.4 27 7.6v8.2c0 6.6-4.5 11-11 13.2C9.5 26.8 5 22.4 5 15.8V7.6Z"></path></svg></span>
            <h3>Quality You Can Trust</h3>
            <p>Built to last, made to be loved.</p>
          </li>
        </ul>

        <section className="about__cta">
          <div className="about__ctaCopy">
            <p className="kicker kicker--gold rv" data-rv><span>Explore Our Collection</span><i className="kicker__rule" aria-hidden="true"></i></p>
            <h2 className="about__ctaTitle rv rv--up" data-rv style={{ ["--rd" as string]: ".08s" }}>Bring Your Vision<br />to Life</h2>
            <p className="about__ctaText rv rv--up" data-rv style={{ ["--rd" as string]: ".16s" }}>
              Discover our curated collections and find pieces that make your house feel like home.
            </p>
            <a className="btn-solid rv rv--up" href="/shop" data-rv style={{ ["--rd" as string]: ".24s" }}>
              <span>Shop Now</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </a>
          </div>
          <figure className="about__ctaMedia rv rv--zoom" data-rv>
            <img src="/about/Screenshot 2026-09-26 050500.png" alt="A sunlit living room with layered antique vases and a linen sofa" loading="lazy" />
          </figure>
        </section>
      </main>

      <StorefrontChrome />
      <AboutStats />
    </>
  );
}
