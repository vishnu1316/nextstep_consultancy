function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">ConsultPro</div>

      <ul className="nav-links">
        <li>
          <a href="#">Home</a>
        </li>

        <li>
          <a href="#">About</a>
        </li>

        <li>
          <a href="#">Services</a>
        </li>

        <li>
          <a href="#">Consultants</a>
        </li>

        <li>
          <a href="#">Contact</a>
        </li>

        <li>
          <a href="#" className="consultation-btn">
            Get Consultation
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;