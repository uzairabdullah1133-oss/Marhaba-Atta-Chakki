
function showComplaintModal() {
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px;">
                <h3><i class="fa-solid fa-comment-dots"></i> Submit a Complaint</h3>
                <p>We value your feedback. Let us know if you faced any issues.</p>
                <form onsubmit="submitComplaint(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" id="comp-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Issue Description</label>
                        <textarea id="comp-desc" class="form-control" rows="3" required></textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Complaint</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}
