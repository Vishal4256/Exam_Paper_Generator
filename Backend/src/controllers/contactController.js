export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, message)' });
    }

    // Here you would typically save the message to the database or send an email.
    // For now, we will just return a success response to acknowledge receipt.
    // Example: await emailService.sendContactEmail(name, email, message);

    res.status(200).json({ message: 'Your message has been sent successfully. We will get back to you soon!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'An error occurred while sending your message. Please try again later.' });
  }
};
