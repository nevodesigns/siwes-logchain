// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SIWESLog
 * @notice Tamper-proof onchain logbook for Nigerian industrial training (SIWES).
 *         Students submit daily log hashes. Supervisors approve them onchain.
 *         Institutions can verify any student's complete log chain publicly.
 */
contract SIWESLog {

    // ── Data structures ─────────────────────────────────────────────────────

    struct LogEntry {
        bytes32  contentHash;      // keccak256 of the raw log text (hashed client-side)
        uint256  timestamp;        // block timestamp at submission
        bool     approved;         // supervisor has approved
        uint256  approvedAt;       // timestamp of approval (0 if not yet approved)
        string   weekLabel;        // e.g. "Week 3 - Day 2" for display
    }

    struct StudentProfile {
        string   name;             // student full name
        string   matricNumber;     // e.g. "2025/B/SENG/0467"
        string   institution;      // e.g. "Miva Open University"
        address  supervisor;       // wallet address of assigned supervisor
        bool     registered;
    }

    // ── State ────────────────────────────────────────────────────────────────

    mapping(address => StudentProfile)  public students;
    mapping(address => LogEntry[])      private logEntries;

    // supervisor => list of students assigned to them
    mapping(address => address[])       private supervisorStudents;

    // ── Events ───────────────────────────────────────────────────────────────

    event StudentRegistered(address indexed student, string matricNumber, address supervisor);
    event EntrySubmitted(address indexed student, uint256 indexed entryIndex, bytes32 contentHash, string weekLabel);
    event EntryApproved(address indexed supervisor, address indexed student, uint256 indexed entryIndex);

    // ── Student functions ────────────────────────────────────────────────────

    /**
     * @notice Register as a SIWES student and link your supervisor's wallet.
     */
    function register(
        string calldata name,
        string calldata matricNumber,
        string calldata institution,
        address supervisor
    ) external {
        require(!students[msg.sender].registered, "Already registered");
        require(supervisor != address(0), "Invalid supervisor");

        students[msg.sender] = StudentProfile({
            name:          name,
            matricNumber:  matricNumber,
            institution:   institution,
            supervisor:    supervisor,
            registered:    true
        });

        supervisorStudents[supervisor].push(msg.sender);

        emit StudentRegistered(msg.sender, matricNumber, supervisor);
    }

    /**
     * @notice Submit a daily log entry. Hash the text client-side before calling.
     * @param contentHash  keccak256 of the log text (keeps raw content off-chain)
     * @param weekLabel    Human-readable label e.g. "Week 3 - Day 2"
     */
    function submitEntry(bytes32 contentHash, string calldata weekLabel) external {
        require(students[msg.sender].registered, "Not registered");
        require(contentHash != bytes32(0), "Empty hash");

        logEntries[msg.sender].push(LogEntry({
            contentHash:  contentHash,
            timestamp:    block.timestamp,
            approved:     false,
            approvedAt:   0,
            weekLabel:    weekLabel
        }));

        uint256 idx = logEntries[msg.sender].length - 1;
        emit EntrySubmitted(msg.sender, idx, contentHash, weekLabel);
    }

    // ── Supervisor functions ─────────────────────────────────────────────────

    /**
     * @notice Approve a student's log entry. Only their assigned supervisor can call this.
     */
    function approveEntry(address student, uint256 entryIndex) external {
        require(students[student].supervisor == msg.sender, "Not this student's supervisor");
        require(entryIndex < logEntries[student].length, "Invalid entry index");
        require(!logEntries[student][entryIndex].approved, "Already approved");

        logEntries[student][entryIndex].approved   = true;
        logEntries[student][entryIndex].approvedAt = block.timestamp;

        emit EntryApproved(msg.sender, student, entryIndex);
    }

    // ── View functions (for frontend and institution verification) ────────────

    /**
     * @notice Get all log entries for a student.
     */
    function getEntries(address student) external view returns (LogEntry[] memory) {
        return logEntries[student];
    }

    /**
     * @notice Get total number of entries for a student.
     */
    function getEntryCount(address student) external view returns (uint256) {
        return logEntries[student].length;
    }

    /**
     * @notice Get all students assigned to a supervisor.
     */
    function getSupervisorStudents(address supervisor) external view returns (address[] memory) {
        return supervisorStudents[supervisor];
    }

    /**
     * @notice Verify a single entry: returns hash, timestamp, and approval status.
     *         Designed for institution-facing verification portal.
     */
    function verifyEntry(address student, uint256 entryIndex)
        external view
        returns (bytes32 contentHash, uint256 submittedAt, bool approved, uint256 approvedAt)
    {
        require(entryIndex < logEntries[student].length, "Invalid entry index");
        LogEntry memory e = logEntries[student][entryIndex];
        return (e.contentHash, e.timestamp, e.approved, e.approvedAt);
    }
}
