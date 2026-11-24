
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "All complaint fields are required",
      });
    }

    const userId = req.session.userId;

    const { imagePath, imagePublicId } =
      getUploadedImageDetails(req.file);

    const [result] = await db.query(
      `INSERT INTO complaints
       (user_id, title, description, category, priority, status,
        image_path, image_public_id)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        userId,
        title,
        description,
        category,
        priority,
        imagePath,
        imagePublicId,
      ]
    );

    // Send acknowledgement email in the background.
    // Do not make complaint submission wait for email delivery.
    Promise.resolve()
      .then(async () => {
        const [users] = await db.query(
          "SELECT name, email FROM users WHERE id = ?",
          [userId]
        );

        if (users.length > 0) {
          await sendComplaintAcknowledgement(
            {
              id: result.insertId,
              title,
              category,
              priority,
            },
            users[0]
          );

          console.log("Complaint acknowledgement email sent");
        }
      })
      .catch((emailError) => {
        console.error(
          "Background acknowledgement email failed:",
          emailError
        );
      });

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaintId: result.insertId,
    });

  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create complaint",
    });
  }
};
