import { useState } from "react";
import { Button, Icon, Logo, navigate, type Route } from "../components/ui";

export function Marketing() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="marketing">
      <header className="public-nav">
        <Logo />
        <nav>
          <a href="#journey" onClick={() => setMenuOpen(false)}>
            Journey
          </a>
          <a href="#roles" onClick={() => setMenuOpen(false)}>
            For everyone
          </a>
          <a href="#preview" onClick={() => setMenuOpen(false)}>
            Product tour
          </a>
        </nav>
        <button
          className="public-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "x" : "menu"} />
        </button>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate("login")}>
            Log in
          </Button>
          <Button onClick={() => navigate("register")} icon="arrow">
            Get started
          </Button>
        </div>
      </header>
      {menuOpen && (
        <nav id="public-mobile-menu" className="public-mobile-menu" aria-label="Mobile navigation">
          <a href="#journey" onClick={() => setMenuOpen(false)}>
            Journey
          </a>
          <a href="#roles" onClick={() => setMenuOpen(false)}>
            For everyone
          </a>
          <a href="#preview" onClick={() => setMenuOpen(false)}>
            Product tour
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("login");
            }}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("register");
            }}
          >
            Get started
          </button>
        </nav>
      )}
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span></span> The complete examination lifecycle
            </div>
            <h1>
              From first question
              <br />
              to <em>final insight.</em>
            </h1>
            <p>
              One connected workspace to prepare examinations, attempt with confidence, and turn
              every result into a clearer next step.
            </p>
            <div className="hero-actions">
              <Button onClick={() => navigate("login", { role: "student" })} icon="arrow">
                Login as a student
              </Button>
              <Button variant="secondary" onClick={() => navigate("login", { role: "teacher" })}>
                Login as a teacher
              </Button>
            </div>
            <button className="text-btn home-register-link" onClick={() => navigate("register")}>
              New student? Create an account <Icon name="arrow" size={14} />
            </button>
            <div className="hero-proof">
              <span>
                <Icon name="check" size={15} /> Purpose-built for focus
              </span>
              <span>
                <Icon name="check" size={15} /> Every role, one system
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Exam interface preview">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="question-card-float">
              <div className="mini-top">
                <span>QUESTION 08 / 24</span>
                <span className="mini-time">
                  <Icon name="clock" size={14} /> 32:18
                </span>
              </div>
              <div className="mini-progress">
                <i></i>
              </div>
              <h3>Which organelle is responsible for producing energy?</h3>
              {["Golgi apparatus", "Mitochondrion", "Lysosome"].map((x, i) => (
                <div className={`mini-option ${i === 1 ? "selected" : ""}`} key={x}>
                  <b>{String.fromCharCode(65 + i)}</b>
                  {x}
                  {i === 1 && <Icon name="check" size={16} />}
                </div>
              ))}
              <div className="mini-footer">
                <span>
                  <Icon name="flag" size={15} /> Review later
                </span>
                <span className="preview-next">
                  Next <Icon name="arrow" size={15} />
                </span>
              </div>
            </div>
            <div className="float-pill pill-a">
              <span>18</span>
              <div>
                Answered<small>6 remaining</small>
              </div>
            </div>
            <div className="float-pill pill-b">
              <Icon name="chart" />
              <div>
                Review ready<small>Insights unlocked</small>
              </div>
            </div>
          </div>
        </section>

        <section className="journey" id="journey">
          <div className="section-kicker">ONE RHYTHM, THREE MOMENTS</div>
          <h2>The exam journey, made visible.</h2>
          <div className="journey-grid">
            {[
              [
                "01",
                "PREPARE",
                "Know what is ahead.",
                "Clear instructions, availability, question structure, and readiness checks remove uncertainty before the clock starts.",
              ],
              [
                "02",
                "ATTEMPT",
                "Stay in the flow.",
                "A calm, distraction-free workspace keeps time, progress, answers, and review states instantly understandable.",
              ],
              [
                "03",
                "REVIEW",
                "Learn from the outcome.",
                "Results become useful feedback through question-level explanations and meaningful performance breakdowns.",
              ],
            ].map((item, i) => (
              <article key={item[1]} className={`journey-card j${i}`}>
                <div className="journey-num">{item[0]}</div>
                <span className="journey-label">{item[1]}</span>
                <h3>{item[2]}</h3>
                <p>{item[3]}</p>
                <div className="journey-line">
                  <i></i>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="roles" id="roles">
          <div className="roles-copy">
            <div className="section-kicker">BUILT AROUND RESPONSIBILITY</div>
            <h2>
              Different work.
              <br />
              One shared language.
            </h2>
            <p>
              ExamSpark adapts to what each person needs to accomplish without splitting the
              experience into disconnected products.
            </p>
          </div>
          <div className="role-stack">
            <RoleBand
              number="01"
              title="Students"
              text="Discover, prepare, attempt and understand every result."
              action="Open student workspace"
              route="student"
              color="orange"
            />
            <RoleBand
              number="02"
              title="Teachers"
              text="Compose thoughtful exams and see where learning lands."
              action="Open teacher workspace"
              route="teacher"
              color="violet"
            />
            <RoleBand
              number="03"
              title="Administrators"
              text="Keep people, examinations and platform activity in view."
              action="Open admin workspace"
              route="admin"
              color="green"
            />
          </div>
        </section>

        <section className="product-preview" id="preview">
          <div className="preview-heading">
            <div>
              <div className="section-kicker">DESIGNED FOR THE DECISIVE MOMENT</div>
              <h2>Focus has an interface.</h2>
            </div>
            <p>
              Every element in the attempt workspace earns its place: time, progress, confidence,
              and the question at hand.
            </p>
          </div>
          <div className="browser">
            <div className="browser-bar">
              <i></i>
              <i></i>
              <i></i>
              <span>exam workspace · biology</span>
            </div>
            <div className="browser-body">
              <aside>
                <Logo inverse />
                <small>QUESTION MAP</small>
                <div className="number-map">
                  {Array.from({ length: 20 }, (_, i) => (
                    <b
                      className={i < 11 ? "done" : i === 11 ? "current" : i === 15 ? "review" : ""}
                      key={i}
                    >
                      {i + 1}
                    </b>
                  ))}
                </div>
                <div className="map-legend">
                  <span>
                    <i className="done"></i>Answered
                  </span>
                  <span>
                    <i></i>Unanswered
                  </span>
                  <span>
                    <i className="review"></i>Review
                  </span>
                </div>
              </aside>
              <div className="browser-main">
                <div className="exam-demo-head">
                  <div>
                    <small>DBMS–301</small>
                    <strong>Database Management System</strong>
                  </div>
                  <div className="demo-timer">
                    <small>TIME REMAINING</small>
                    <strong>32 : 18</strong>
                  </div>
                </div>
                <div className="demo-question">
                  <span>MULTIPLE CHOICE · 2 MARKS</span>
                  <h3>How does the structure of a mitochondrion support its primary function?</h3>
                  <div className="demo-answer selected">
                    <b>B</b>
                    <p>
                      The folded inner membrane increases surface area for ATP-producing reactions.
                    </p>
                    <Icon name="check" />
                  </div>
                  <div className="demo-answer">
                    <b>C</b>
                    <p>Its outer membrane stores genetic information used during cell division.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div>
            <span className="section-kicker">YOUR NEXT EXAM STARTS HERE</span>
            <h2>
              Turn assessment into
              <br />
              <em>forward motion.</em>
            </h2>
          </div>
          <Button variant="dark" onClick={() => navigate("register")} icon="arrow">
            Create your account
          </Button>
        </section>
      </main>
      <footer>
        <div>
          <Logo inverse />
          <p>
            A focused examination experience
            <br />
            for every side of learning.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <b>Product</b>
            <a href="#journey">Journey</a>
            <a href="#roles">Workspaces</a>
            <a href="#preview">Preview</a>
          </div>
          <div>
            <b>Access</b>
            <button onClick={() => navigate("login", { role: "student" })}>Student login</button>
            <button onClick={() => navigate("login", { role: "teacher" })}>Teacher login</button>
            <button onClick={() => navigate("login", { role: "admin" })}>Admin login</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 ExamSpark · Frontend demonstration</span>
          <span>No real records or grading are used.</span>
        </div>
      </footer>
    </div>
  );
}

export function RoleBand({
  number,
  title,
  text,
  action,
  route,
  color,
}: {
  number: string;
  title: string;
  text: string;
  action: string;
  route: Route;
  color: string;
}) {
  return (
    <article className={`role-band ${color}`}>
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <button onClick={() => navigate("login", { role: route })}>
        {action}
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}
